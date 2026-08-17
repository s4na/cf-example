import { env } from "cloudflare:workers";
import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

const testEnv = env as unknown as { DB: D1Database };

describe("管理用記事API", () => {
  beforeEach(async () => {
    await testEnv.DB.prepare("DELETE FROM articles").run();
  });

  it("下書きを作成して公開する", async () => {
    const createResponse = await SELF.fetch(
      new Request("https://example.com/api/admin/articles", {
        body: JSON.stringify({
          bodyMarkdown: "# 本文",
          slug: "hello",
          title: "Hello",
        }),
        headers: {
          "Content-Type": "application/json",
          Origin: "https://example.com",
        },
        method: "POST",
      }),
    );
    const created = (await createResponse.json()) as {
      article: { id: string };
    };

    expect(createResponse.status).toBe(201);

    const publishResponse = await SELF.fetch(
      new Request(
        `https://example.com/api/admin/articles/${created.article.id}/publish`,
        {
          body: "{}",
          headers: { Origin: "https://example.com" },
          method: "POST",
        },
      ),
    );

    expect(publishResponse.status).toBe(200);
  });

  it("異なるOriginからの更新を拒否する", async () => {
    const response = await SELF.fetch(
      new Request("https://example.com/api/admin/articles", {
        body: "{}",
        headers: { Origin: "https://attacker.example" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
  });
});
