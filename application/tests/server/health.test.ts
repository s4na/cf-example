import { describe, expect, it } from "vitest";
import app from "../../src/server";

describe("GET /api/health", () => {
  it("稼働状態を返す", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
