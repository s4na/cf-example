import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import {
  requireAdmin,
  type AccessBindings,
} from "../../src/server/auth/access";

function createApp() {
  const app = new Hono<{ Bindings: AccessBindings }>();
  app.use("*", requireAdmin);
  app.get("/", (context) => context.text("ok"));
  return app;
}

describe("requireAdmin", () => {
  it("設定不足の場合は処理を拒否する", async () => {
    const response = await createApp().request("/", {}, {});
    expect(response.status).toBe(503);
  });

  it("Accessトークンがない場合は認証を要求する", async () => {
    const response = await createApp().request(
      "/",
      {},
      {
        CF_ACCESS_AUD: "test-audience",
        CF_ACCESS_TEAM_DOMAIN: "https://example.cloudflareaccess.com",
      },
    );
    expect(response.status).toBe(401);
  });

  it("テスト環境で明示した場合だけ認証を迂回する", async () => {
    const response = await createApp().request(
      "/",
      {},
      { ADMIN_AUTH_BYPASS: "true" },
    );
    expect(response.status).toBe(200);
  });
});
