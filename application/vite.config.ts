import { cloudflare } from "@cloudflare/vite-plugin";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    preact(),
    cloudflare({
      configPath:
        process.env.CF_WRANGLER_CONFIG ??
        "../infrastructure/cloudflare/wrangler.jsonc",
      persistState: { path: "../.wrangler/state" },
    }),
  ],
});
