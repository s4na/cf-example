import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [preact()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
