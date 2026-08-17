import type { Article, ArticleInput } from "../../shared/article";

type ArticleRow = {
  body_markdown: string;
  created_at: string;
  id: string;
  published_at: string | null;
  slug: string;
  status: "draft" | "published";
  title: string;
  updated_at: string;
};

function fromRow(row: ArticleRow): Article {
  return {
    bodyMarkdown: row.body_markdown,
    createdAt: row.created_at,
    id: row.id,
    publishedAt: row.published_at,
    slug: row.slug,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

export class ArticleRepository {
  constructor(private readonly database: D1Database) {}

  async createDraft(input: ArticleInput): Promise<Article> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.database
      .prepare(
        `INSERT INTO articles
          (id, title, slug, body_markdown, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
      )
      .bind(id, input.title, input.slug, input.bodyMarkdown, now, now)
      .run();

    const article = await this.findById(id);
    if (!article) {
      throw new Error("作成した記事を取得できませんでした");
    }
    return article;
  }

  async findById(id: string): Promise<Article | null> {
    const row = await this.database
      .prepare("SELECT * FROM articles WHERE id = ?")
      .bind(id)
      .first<ArticleRow>();

    return row ? fromRow(row) : null;
  }

  async findPublishedBySlug(slug: string): Promise<Article | null> {
    const row = await this.database
      .prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published'")
      .bind(slug)
      .first<ArticleRow>();

    return row ? fromRow(row) : null;
  }

  async listPublished(): Promise<Article[]> {
    const result = await this.database
      .prepare(
        `SELECT * FROM articles
         WHERE status = 'published'
         ORDER BY published_at DESC`,
      )
      .all<ArticleRow>();

    return result.results.map(fromRow);
  }

  async listPublishedMetadata(limit = 100): Promise<Article[]> {
    const result = await this.database
      .prepare(
        `SELECT id, title, slug, '' AS body_markdown, status,
                created_at, updated_at, published_at
         FROM articles
         WHERE status = 'published'
         ORDER BY published_at DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<ArticleRow>();

    return result.results.map(fromRow);
  }

  async publish(
    id: string,
    publishedAt = new Date().toISOString(),
  ): Promise<boolean> {
    if (Number.isNaN(new Date(publishedAt).getTime())) {
      throw new RangeError("公開日時が不正です");
    }
    const now = new Date().toISOString();
    const result = await this.database
      .prepare(
        `UPDATE articles
         SET status = 'published', published_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(publishedAt, now, id)
      .run();

    return result.meta.changes === 1;
  }
}
