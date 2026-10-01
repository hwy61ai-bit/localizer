import { defineConfig, devices } from "@playwright/test";

// Smoke suite: `npm run test:smoke`. Chromium only.
//  - setup: seeds E2E data (scripts/e2e-seed.mjs) and signs in the E2E user
//  - unit:  pure Node checks (format catalog, coverage, date formatting)
//  - smoke: browser tests against the dev server, using the saved session
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "unit", testMatch: /unit\/.*\.spec\.ts/ },
    {
      name: "smoke",
      testMatch: /smoke\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: "e2e/.auth/user.json",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
