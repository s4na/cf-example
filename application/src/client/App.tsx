import { site } from "../shared/site";

export function App() {
  return (
    <main class="shell">
      <header>
        <p class="eyebrow">Personal blog</p>
        <h1>{site.title}</h1>
      </header>
      <p>{site.description}</p>
    </main>
  );
}
