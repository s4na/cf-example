import { Hono } from "hono";
import * as v from "valibot";
import { articleInputSchema } from "../../shared/article";
import { ArticleRepository } from "./repository";

type Bindings = {
  DB: D1Database;
};

export const adminArticles = new Hono<{ Bindings: Bindings }>();

function validateInput(value: unknown) {
  const result = v.safeParse(articleInputSchema, value);
  if (result.success) return { input: result.output } as const;
  return { errors: result.issues.map((issue) => issue.message) } as const;
}

function isConstraintError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("UNIQUE constraint failed")
  );
}

adminArticles.use("*", async (context, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(context.req.method)) {
    const origin = context.req.header("Origin");
    if (!origin || origin !== new URL(context.req.url).origin) {
      return context.json({ error: "不正な送信元です" }, 403);
    }
  }
  await next();
});

adminArticles.get("/", async (context) => {
  const articles = await new ArticleRepository(context.env.DB).listAll();
  return context.json({ articles });
});

adminArticles.get("/:id", async (context) => {
  const article = await new ArticleRepository(context.env.DB).findById(
    context.req.param("id"),
  );
  return article
    ? context.json({ article })
    : context.json({ error: "記事が見つかりません" }, 404);
});

adminArticles.post("/", async (context) => {
  const body = await context.req.json().catch(() => null);
  const result = validateInput(body);
  if ("errors" in result) {
    return context.json({ errors: result.errors }, 400);
  }

  try {
    const article = await new ArticleRepository(context.env.DB).createDraft(
      result.input,
    );
    return context.json({ article }, 201);
  } catch (error) {
    if (isConstraintError(error)) {
      return context.json({ error: "同じslugの記事が存在します" }, 409);
    }
    throw error;
  }
});

adminArticles.put("/:id", async (context) => {
  const body = await context.req.json().catch(() => null);
  const result = validateInput(body);
  if ("errors" in result) {
    return context.json({ errors: result.errors }, 400);
  }

  try {
    const article = await new ArticleRepository(context.env.DB).update(
      context.req.param("id"),
      result.input,
    );
    return article
      ? context.json({ article })
      : context.json({ error: "記事が見つかりません" }, 404);
  } catch (error) {
    if (isConstraintError(error)) {
      return context.json({ error: "同じslugの記事が存在します" }, 409);
    }
    throw error;
  }
});

adminArticles.post("/:id/publish", async (context) => {
  const updated = await new ArticleRepository(context.env.DB).publish(
    context.req.param("id"),
  );
  return updated
    ? context.json({ status: "published" })
    : context.json({ error: "記事が見つかりません" }, 404);
});

adminArticles.post("/:id/unpublish", async (context) => {
  const updated = await new ArticleRepository(context.env.DB).unpublish(
    context.req.param("id"),
  );
  return updated
    ? context.json({ status: "draft" })
    : context.json({ error: "記事が見つかりません" }, 404);
});
