import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true
  },
  webServer: {
    command: "npm run dev",
    reuseExistingServer: !process.env.CI,
    port: 5173
  }
});
