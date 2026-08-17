import * as v from "valibot";

export const articleInputSchema = v.object({
  bodyMarkdown: v.string(),
  slug: v.pipe(
    v.string(),
    v.minLength(1, "slugを入力してください"),
    v.maxLength(120, "slugは120文字以内で入力してください"),
    v.regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slugは英小文字、数字、ハイフンで入力してください",
    ),
  ),
  title: v.pipe(
    v.string(),
    v.minLength(1, "タイトルを入力してください"),
    v.maxLength(160, "タイトルは160文字以内で入力してください"),
  ),
});

export type ArticleInput = v.InferOutput<typeof articleInputSchema>;

export type ArticleStatus = "draft" | "published";

export type Article = ArticleInput & {
  createdAt: string;
  id: string;
  publishedAt: string | null;
  status: ArticleStatus;
  updatedAt: string;
};
