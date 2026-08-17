import { Hono } from "hono";

type Bindings = {
  MEDIA: R2Bucket;
};

const maxImageBytes = 5 * 1024 * 1024;
const maxMultipartBytes = maxImageBytes + 64 * 1024;

async function readBodyWithLimit(
  request: Request,
  limit: number,
): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

const imageTypes = {
  "image/gif": {
    extension: "gif",
    matches: (bytes: Uint8Array) =>
      new TextDecoder().decode(bytes.slice(0, 6)) === "GIF87a" ||
      new TextDecoder().decode(bytes.slice(0, 6)) === "GIF89a",
  },
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 8 &&
      bytes
        .slice(0, 8)
        .every(
          (value, index) =>
            value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index],
        ),
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes: Uint8Array) =>
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP",
  },
} as const;

export const media = new Hono<{ Bindings: Bindings }>();

media.post("/", async (context) => {
  const origin = context.req.header("Origin");
  if (!origin || origin !== new URL(context.req.url).origin) {
    return context.json({ error: "不正な送信元です" }, 403);
  }

  const rawBody = await readBodyWithLimit(
    context.req.raw,
    maxMultipartBytes,
  );
  if (!rawBody) {
    return context.json({ error: "アップロード容量が大きすぎます" }, 413);
  }

  let form: FormData;
  try {
    form = await new Request(context.req.url, {
      body: rawBody,
      headers: context.req.raw.headers,
      method: "POST",
    }).formData();
  } catch {
    return context.json({ error: "画像データを読み取れませんでした" }, 400);
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return context.json({ error: "画像を選択してください" }, 400);
  }
  if (file.size === 0 || file.size > maxImageBytes) {
    return context.json({ error: "画像は5MB以内にしてください" }, 400);
  }

  const type = imageTypes[file.type as keyof typeof imageTypes];
  if (!type) {
    return context.json(
      { error: "JPEG、PNG、GIF、WebPだけアップロードできます" },
      400,
    );
  }

  const data = await file.arrayBuffer();
  if (!type.matches(new Uint8Array(data).slice(0, 16))) {
    return context.json({ error: "画像の内容を確認できませんでした" }, 400);
  }

  const now = new Date();
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${type.extension}`;
  await context.env.MEDIA.put(key, data, {
    httpMetadata: { contentType: file.type },
  });

  return context.json({ url: `/media/${key}` }, 201);
});

export async function serveMedia(
  bucket: R2Bucket,
  key: string,
): Promise<Response> {
  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
