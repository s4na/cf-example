import { env } from "cloudflare:workers";
import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { ArticleRepository } from "../../src/server/articles/repository";

const testEnv = env as unknown as { DB: D1Database };

describe("公開ブログ", () => {
  const repository = new ArticleRepository(testEnv.DB);

  beforeEach(async () => {
    await testEnv.DB.prepare("DELETE FROM articles").run();
  });

  it("公開記事をHTMLで表示する", async () => {
    const article = await repository.createDraft({
      bodyMarkdown: "# 本文\n\nHello.",
      slug: "hello",
      title: "最初の記事",
    });
    await repository.publish(article.id, "2026-08-17T00:00:00.000Z");

    const response = await SELF.fetch(
      new Request("https://example.com/articles/hello"),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("<h1>最初の記事</h1>");
    expect(html).toContain("<h1>本文</h1>");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
  });

  it("不正な公開日時を保存しない", async () => {
    const article = await repository.createDraft({
      bodyMarkdown: "本文",
      slug: "invalid-date",
      title: "日時テスト",
    });

    await expect(repository.publish(article.id, "invalid")).rejects.toThrow(
      "公開日時が不正です",
    );
    expect(await repository.findPublishedBySlug(article.slug)).toBeNull();
  });

  it("RSSからXMLで禁止された制御文字を除去する", async () => {
    const article = await repository.createDraft({
      bodyMarkdown: "本文",
      slug: "rss-control",
      title: "RSS\u0000記事",
    });
    await repository.publish(article.id, "2026-08-17T00:00:00.000Z");

    const response = await SELF.fetch(
      new Request("https://example.com/rss.xml"),
    );
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(xml).toContain("<title>RSS記事</title>");
    expect(xml).not.toContain("\u0000");
  });

  it("存在しない記事には404を返す", async () => {
    const response = await SELF.fetch(
      new Request("https://example.com/articles/missing"),
    );

    expect(response.status).toBe(404);
  });
});
