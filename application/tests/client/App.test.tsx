import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { App } from "../../src/client/App";

describe("App", () => {
  it("サイト名と説明を表示する", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "cf-example" })).toBeVisible();
    expect(screen.getByText("Cloudflareで動く軽量ブログ")).toBeVisible();
  });
});
