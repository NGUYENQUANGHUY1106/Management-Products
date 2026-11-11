import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  // Each scenario covers many live Firebase requests, reloads and role transitions.
  timeout: 120000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/testing/browser-results.json" }],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL: process.env.PRODUCT_WEB_URL || "http://localhost:8082",
    video: "on",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
