import { defineConfig } from "@playwright/test";
export default defineConfig({
  timeout: 90000,
  testDir: "./tests/email-builder",
  use: {
    channel: "msedge",
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE || undefined,
    trace: "retain-on-failure",
  },
  fullyParallel: false,
});
