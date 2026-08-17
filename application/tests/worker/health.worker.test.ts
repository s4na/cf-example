import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("Cloudflare runtime", () => {
  it("Workerからヘルスチェックを返す", async () => {
    const response = await SELF.fetch("https://example.com/api/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
