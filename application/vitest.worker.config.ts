import { fileURLToPath } from "node:url";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      miniflare: {
        assets: { directory: "./dist/client" },
        bindings: {
          ADMIN_AUTH_BYPASS: "true",
          TEST_MIGRATIONS: await readD1Migrations(
            fileURLToPath(
              new URL(
                "../infrastructure/cloudflare/migrations",
                import.meta.url,
              ),
            ),
          ),
        },
      },
      wrangler: {
        configPath: "../infrastructure/cloudflare/wrangler.jsonc",
      },
    })),
  ],
  test: {
    include: ["tests/worker/**/*.worker.test.ts"],
    setupFiles: ["./tests/worker/setup.ts"],
  },
});
