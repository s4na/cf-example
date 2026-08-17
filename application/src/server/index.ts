import { Hono, type Handler } from "hono";
import { adminArticles } from "./articles/admin-api";
import { ArticleRepository } from "./articles/repository";
import { requireAdmin, type AccessBindings } from "./auth/access";
import {
  renderArticle,
  renderArticleList,
  renderLayout,
  renderRss,
} from "./public/html";

type Bindings = AccessBindings & {
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

app.use("/admin", requireAdmin);
app.use("/admin/*", requireAdmin);
app.use("/index.html", requireAdmin);
app.use("/api/admin/*", requireAdmin);

const serveAdmin: Handler<{ Bindings: Bindings }> = async (context) => {
  const url = new URL(context.req.url);
  url.pathname = "/";
  const response = await context.env.ASSETS.fetch(
    new Request(url, context.req.raw),
  );
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { headers, status: response.status });
};

app.get("/admin", serveAdmin);
app.get("/admin/", (context) => context.redirect("/admin", 308));
app.get("/index.html", serveAdmin);

app.route("/api/admin/articles", adminArticles);

app.get("/api/health", (context) =>
  context.json({
    status: "ok",
  }),
);

app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));

export default app;
