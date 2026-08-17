import { micromark } from "micromark";
import { useEffect, useRef, useState } from "preact/hooks";
import type { Article, ArticleInput } from "../shared/article";

const emptyArticle: ArticleInput = {
  bodyMarkdown: "",
  slug: "",
  title: "",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json()) as T & {
    error?: string;
    errors?: string[];
  };
  if (!response.ok) {
    throw new Error(
      body.error ?? body.errors?.join("\n") ?? "リクエストに失敗しました",
    );
  }
  return body;
}

export function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState<ArticleInput>(emptyArticle);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const savingRef = useRef(false);
  const publishingRef = useRef(false);
  const current = articles.find((article) => article.id === currentId);
  const busy = saving || publishing;

  async function loadArticles() {
    const result = await request<{ articles: Article[] }>(
      "/api/admin/articles",
    );
    setArticles(result.articles);
  }

  useEffect(() => {
    void loadArticles().catch((error: Error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function choose(article: Article) {
    if (busy) return;
    if (dirty && !window.confirm("未保存の変更を破棄しますか？")) return;
    setCurrentId(article.id);
    setInput({
      bodyMarkdown: article.bodyMarkdown,
      slug: article.slug,
      title: article.title,
    });
    setDirty(false);
    setMessage("");
  }

  function newArticle() {
    if (busy) return;
    if (dirty && !window.confirm("未保存の変更を破棄しますか？")) return;
    setCurrentId(null);
    setInput(emptyArticle);
    setDirty(false);
    setMessage("");
  }

  function change<K extends keyof ArticleInput>(
    key: K,
    value: ArticleInput[K],
  ) {
    setInput((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  }

  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setMessage("保存中…");
    try {
      const result = currentId
        ? await request<{ article: Article }>(
            `/api/admin/articles/${currentId}`,
            {
              body: JSON.stringify(input),
              method: "PUT",
            },
          )
        : await request<{ article: Article }>("/api/admin/articles", {
            body: JSON.stringify(input),
            method: "POST",
          });
      setCurrentId(result.article.id);
      setArticles((previous) => [
        result.article,
        ...previous.filter((article) => article.id !== result.article.id),
      ]);
      setDirty(false);
      setMessage("保存しました");

      try {
        await loadArticles();
      } catch {
        setMessage("保存しましたが、一覧を更新できませんでした");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (publishingRef.current || !currentId || dirty) return;
    publishingRef.current = true;
    setPublishing(true);
    const action = current?.status === "published" ? "unpublish" : "publish";
    try {
      const result = await request<{ article: Article }>(
        `/api/admin/articles/${currentId}/${action}`,
        {
          body: "{}",
          method: "POST",
        },
      );
      setArticles((previous) =>
        previous.map((article) =>
          article.id === result.article.id ? result.article : article,
        ),
      );
      const successMessage =
        action === "publish" ? "公開しました" : "下書きに戻しました";
      setMessage(successMessage);
      try {
        await loadArticles();
      } catch {
        setMessage(`${successMessage}が、一覧を更新できませんでした`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新に失敗しました");
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  }

  return (
    <main class="admin-shell">
      <aside>
        <div class="aside-header">
          <h1>記事</h1>
          <button type="button" onClick={newArticle} disabled={busy}>
            新規
          </button>
        </div>
        <ul class="admin-list">
          {articles.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => choose(article)}
                disabled={busy}
              >
                <strong>{article.title}</strong>
                <span>
                  {article.status === "published" ? "公開" : "下書き"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section class="editor" aria-label="記事エディタ">
        <label>
          タイトル
          <input
            value={input.title}
            disabled={busy}
            onInput={(event) => change("title", event.currentTarget.value)}
          />
        </label>
        <label>
          slug
          <input
            value={input.slug}
            disabled={busy}
            onInput={(event) => change("slug", event.currentTarget.value)}
          />
        </label>
        <div class="editor-columns">
          <label>
            Markdown
            <textarea
              value={input.bodyMarkdown}
              disabled={busy}
              onInput={(event) =>
                change("bodyMarkdown", event.currentTarget.value)
              }
            />
          </label>
          <section class="preview" aria-label="プレビュー">
            <span>プレビュー</span>
            <div
              dangerouslySetInnerHTML={{
                __html: micromark(input.bodyMarkdown),
              }}
            />
          </section>
        </div>
        <div class="editor-actions">
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || (!dirty && currentId !== null)}
          >
            下書きを保存
          </button>
          <button
            type="button"
            onClick={() => void togglePublish()}
            disabled={busy || !currentId || dirty}
          >
            {current?.status === "published" ? "非公開にする" : "公開する"}
          </button>
          <output aria-live="polite">{message}</output>
        </div>
      </section>
    </main>
  );
}
