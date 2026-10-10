import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/e2e.spec.ts", "**/places.e2e.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: "node --import tsx tests/serve.ts",
    url: "http://127.0.0.1:4173/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
