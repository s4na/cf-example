import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "pnpm exec wrangler d1 migrations apply cf-example-e2e --local --persist-to ../.wrangler/state --config ../infrastructure/cloudflare/wrangler.e2e.jsonc && pnpm e2e:serve",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:5173/api/health",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
