import { defineConfig, devices } from "@playwright/test";

const PORT = 9127;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Tests run against the committed production bundle, exactly as HACS ships it.
  webServer: {
    command: `node scripts/serve.mjs . ${PORT}`,
    url: `http://127.0.0.1:${PORT}/demo/`,
    reuseExistingServer: !process.env.CI,
  },
});
