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

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
  timeZone: "Asia/Tokyo",
});

function formatDate(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function renderPublishedTime(value: string | null): string {
  if (!value) return "";
  const formatted = formatDate(value);
  return formatted
    ? `<time datetime="${escapeHtml(value)}">${formatted}</time>`
    : "";
}

function escapeXml(value: string): string {
  const validXml = Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint === 0x09 ||
        codePoint === 0x0a ||
        codePoint === 0x0d ||
        (codePoint !== undefined &&
          ((codePoint >= 0x20 && codePoint <= 0xd7ff) ||
            (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
            (codePoint >= 0x10000 && codePoint <= 0x10ffff)))
      );
    })
    .join("");
  return escapeHtml(validXml);
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
        ${renderPublishedTime(article.publishedAt)}
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
  const published = renderPublishedTime(article.publishedAt);

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
        <title>${escapeXml(article.title)}</title>
        <link>${escapeXml(url)}</link>
        <guid>${escapeXml(url)}</guid>
        ${article.publishedAt && formatDate(article.publishedAt) ? `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>` : ""}
      </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
  <title>${escapeXml(site.title)}</title>
  <link>${escapeXml(origin)}</link>
  <description>${escapeXml(site.description)}</description>
  ${items}
</channel></rss>`;
}
