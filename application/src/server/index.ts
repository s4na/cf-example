import { Hono } from "hono";
import { ArticleRepository } from "./articles/repository";
import {
  renderArticle,
  renderArticleList,
  renderLayout,
  renderRss,
} from "./public/html";

type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

const htmlHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  "Content-Type": "text/html; charset=UTF-8",
  "X-Content-Type-Options": "nosniff",
};

app.get("/", async (context) => {
  const articles = await new ArticleRepository(
    context.env.DB,
  ).listPublishedMetadata();
  const url = new URL(context.req.url);
  return context.body(
    renderLayout({
      canonicalUrl: `${url.origin}/`,
      content: renderArticleList(articles),
    }),
    200,
    htmlHeaders,
  );
});

app.get("/articles/:slug", async (context) => {
  const canonicalUrl = new URL(context.req.url);
  canonicalUrl.search = "";
  canonicalUrl.hash = "";
  const article = await new ArticleRepository(
    context.env.DB,
  ).findPublishedBySlug(context.req.param("slug"));

  if (!article) {
    return context.body(
      renderLayout({
        canonicalUrl: canonicalUrl.toString(),
        content: "<h1>404</h1><p>記事が見つかりませんでした。</p>",
        title: "記事が見つかりません",
      }),
      404,
      htmlHeaders,
    );
  }

  canonicalUrl.pathname = `/articles/${encodeURIComponent(article.slug)}`;
  return context.body(
    renderLayout({
      canonicalUrl: canonicalUrl.toString(),
      content: renderArticle(article),
      description: article.bodyMarkdown.slice(0, 120),
      title: article.title,
    }),
    200,
    htmlHeaders,
  );
});

app.get("/rss.xml", async (context) => {
  const articles = await new ArticleRepository(
    context.env.DB,
  ).listPublishedMetadata();
  return context.body(
    renderRss(articles, new URL(context.req.url).origin),
    200,
    {
      "Content-Type": "application/rss+xml; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
    },
  );
});

app.get("/api/health", (context) =>
  context.json({
    status: "ok",
  }),
);

app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));

export default app;
