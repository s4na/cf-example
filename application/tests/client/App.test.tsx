import { render, screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/client/App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ articles: [] }), {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  it("記事エディタを表示する", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "記事" })).toBeVisible();
    expect(screen.getByRole("region", { name: "記事エディタ" })).toBeVisible();
  });
});
