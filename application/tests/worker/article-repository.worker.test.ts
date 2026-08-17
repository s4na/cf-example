import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { ArticleRepository } from "../../src/server/articles/repository";

const testEnv = env as unknown as { DB: D1Database };

describe("ArticleRepository", () => {
  const repository = new ArticleRepository(testEnv.DB);

  beforeEach(async () => {
    await testEnv.DB.prepare("DELETE FROM articles").run();
  });

  it("公開した記事だけを新しい順で取得する", async () => {
    const older = await repository.createDraft({
      bodyMarkdown: "older",
      slug: "older",
      title: "古い記事",
    });
    await repository.publish(older.id, "2026-08-16T00:00:00.000Z");

    const newer = await repository.createDraft({
      bodyMarkdown: "newer",
      slug: "newer",
      title: "新しい記事",
    });
    await repository.publish(newer.id, "2026-08-17T00:00:00.000Z");

    await repository.createDraft({
      bodyMarkdown: "draft",
      slug: "draft",
      title: "下書き",
    });

    const articles = await repository.listPublished();

    expect(articles.map((article) => article.slug)).toEqual(["newer", "older"]);
  });

  it("公開記事をslugで取得する", async () => {
    const article = await repository.createDraft({
      bodyMarkdown: "# 本文",
      slug: "hello-world",
      title: "Hello",
    });
    await repository.publish(article.id);

    await expect(
      repository.findPublishedBySlug("hello-world"),
    ).resolves.toMatchObject({
      slug: "hello-world",
      status: "published",
    });
  });
});
