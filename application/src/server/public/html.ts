import { micromark } from "micromark";
import type { Article } from "../../shared/article";
import { site } from "../../shared/site";

function escapeHtml(value: string): string {
  return value.replaceAll(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "'": "&#39;",
      '"': "&quot;",
      "<": "&lt;",
      ">": "&gt;",
    };
    return entities[character];
  });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export function renderLayout(options: {
  canonicalUrl: string;
  content: string;
  description?: string;
  title?: string;
}): string {
  const title = options.title ? `${options.title} | ${site.title}` : site.title;
  const description = options.description ?? site.description;

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(options.canonicalUrl)}">
    <link rel="canonical" href="${escapeHtml(options.canonicalUrl)}">
    <link rel="alternate" type="application/rss+xml" title="${site.title}" href="/rss.xml">
    <link rel="stylesheet" href="/public.css">
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <header class="site-header"><a href="/">${site.title}</a></header>
    <main>${options.content}</main>
    <footer>© ${new Date().getUTCFullYear()} ${site.title}</footer>
  </body>
</html>`;
}

export function renderArticleList(articles: Article[]): string {
  const items = articles
    .map(
      (article) => `<li>
        <a href="/articles/${encodeURIComponent(article.slug)}">${escapeHtml(article.title)}</a>
        ${article.publishedAt ? `<time datetime="${article.publishedAt}">${formatDate(article.publishedAt)}</time>` : ""}
      </li>`,
    )
    .join("");

  return `<section class="hero">
    <p class="eyebrow">Personal blog</p>
    <h1>${site.title}</h1>
    <p>${site.description}</p>
  </section>
  <section aria-labelledby="articles-heading">
    <h2 id="articles-heading">記事</h2>
    ${items ? `<ol class="article-list">${items}</ol>` : "<p>公開された記事はまだありません。</p>"}
  </section>`;
}

export function renderArticle(article: Article): string {
  const published = article.publishedAt
    ? `<time datetime="${article.publishedAt}">${formatDate(article.publishedAt)}</time>`
    : "";

  return `<article>
    <header class="article-header">
      <h1>${escapeHtml(article.title)}</h1>
      ${published}
    </header>
    <div class="prose">${micromark(article.bodyMarkdown)}</div>
  </article>`;
}

export function renderRss(articles: Article[], origin: string): string {
  const items = articles
    .map((article) => {
      const url = `${origin}/articles/${encodeURIComponent(article.slug)}`;
      return `<item>
        <title>${escapeHtml(article.title)}</title>
        <link>${escapeHtml(url)}</link>
        <guid>${escapeHtml(url)}</guid>
        ${article.publishedAt ? `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>` : ""}
      </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
  <title>${site.title}</title>
  <link>${escapeHtml(origin)}</link>
  <description>${site.description}</description>
  ${items}
</channel></rss>`;
}
