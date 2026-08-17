import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        assets: { directory: "./dist" },
      },
      wrangler: {
        configPath: "../infrastructure/cloudflare/wrangler.jsonc",
      },
    }),
  ],
  test: {
    include: ["tests/worker/**/*.worker.test.ts"],
  },
});
