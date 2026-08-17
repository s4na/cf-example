import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { App } from "../../src/client/App";

describe("App", () => {
  it("管理画面の見出しと対象サイトを表示する", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "記事管理" })).toBeVisible();
    expect(screen.getByText("cf-exampleの記事を管理します。")).toBeVisible();
  });
});
