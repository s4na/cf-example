import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const pngHeader = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe("画像アップロード", () => {
  it("画像をR2へ保存して配信する", async () => {
    const form = new FormData();
    form.set(
      "image",
      new File([pngHeader], "image.png", { type: "image/png" }),
    );

    const uploadResponse = await SELF.fetch(
      new Request("https://example.com/api/admin/media", {
        body: form,
        headers: { Origin: "https://example.com" },
        method: "POST",
      }),
    );
    const uploaded = (await uploadResponse.json()) as { url: string };

    expect(uploadResponse.status).toBe(201);
    expect(uploaded.url).toMatch(/^\/media\/uploads\//);

    const imageResponse = await SELF.fetch(
      new Request(`https://example.com${uploaded.url}`),
    );
    expect(imageResponse.status).toBe(200);
    expect(imageResponse.headers.get("Content-Type")).toBe("image/png");
  });

  it("multipart解析前に過大なbodyを拒否する", async () => {
    const response = await SELF.fetch(
      new Request("https://example.com/api/admin/media", {
        body: new Uint8Array(5 * 1024 * 1024 + 64 * 1024 + 1),
        headers: {
          "Content-Type": "multipart/form-data; boundary=test",
          Origin: "https://example.com",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(413);
  });

  it("PNG署名の短い接頭辞を拒否する", async () => {
    const form = new FormData();
    form.set(
      "image",
      new File([new Uint8Array([0x89])], "short.png", {
        type: "image/png",
      }),
    );

    const response = await SELF.fetch(
      new Request("https://example.com/api/admin/media", {
        body: form,
        headers: { Origin: "https://example.com" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("拡張子だけを偽装したファイルを拒否する", async () => {
    const form = new FormData();
    form.set(
      "image",
      new File(["not an image"], "image.png", { type: "image/png" }),
    );

    const response = await SELF.fetch(
      new Request("https://example.com/api/admin/media", {
        body: form,
        headers: { Origin: "https://example.com" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
  });
});
