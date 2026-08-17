import { site } from "../shared/site";

export function App() {
  return (
    <main class="shell">
      <header>
        <p class="eyebrow">Administration</p>
        <h1>記事管理</h1>
      </header>
      <p>{site.title}の記事を管理します。</p>
    </main>
  );
}
