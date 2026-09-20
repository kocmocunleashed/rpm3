import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 35000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "/tmp/network-studio-tests",
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1366, height: 768 },
    headless: true,
    launchOptions: { args: ["--no-sandbox", "--enable-unsafe-swiftshader"] },
    trace: "retain-on-failure",
  },
});
