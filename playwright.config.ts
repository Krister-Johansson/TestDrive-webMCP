import { defineConfig, devices } from "@playwright/test";
import { E2E_DB_FILE, E2E_PORT } from "./e2e/config";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `pnpm dev --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    // Under .next so tooling that ignores .next (react-doctor, editors) skips the e2e build output too.
    env: { DB_FILE: E2E_DB_FILE, NEXT_DIST_DIR: ".next/e2e" },
    timeout: 120_000,
  },
});
