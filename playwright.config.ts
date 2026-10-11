import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { testDatabaseName } from "./src/lib/test-database";

testDatabaseName();
const databaseUrl = process.env.TEST_DATABASE_URL!;
process.env.DATABASE_URL = databaseUrl;
process.env.DIRECT_DATABASE_URL = databaseUrl;
export default defineConfig({
  testDir: "./tests/browser", fullyParallel: false, workers: 1, retries: process.env.CI ? 1 : 0,
  timeout: 45_000, expect: { timeout: 10_000 },
  globalSetup: "./tests/browser/setup.ts",
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3108", trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3108",
    url: "http://127.0.0.1:3108/login", reuseExistingServer: false, timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl, DIRECT_DATABASE_URL: databaseUrl,
      TEST_DATABASE_URL: databaseUrl, ALLOW_TEST_DATABASE_RESET: "true",
      AUTH_SECRET: "browser-tests-only-secret-with-at-least-32-characters", AUTH_TRUST_HOST: "true",
      AUTH_URL: "http://127.0.0.1:3108", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3108",
      EMAIL_TRANSPORT: "resend", EMAIL_FROM: "AG Wuse <test@example.test>", RESEND_API_KEY: "re_browser_mock",
      PAYSTACK_SECRET_KEY: "sk_test_browser_mock", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "",
      NODE_OPTIONS: `--require="${path.resolve("tests/browser/providers.cjs").replaceAll("\\", "/")}"`,
      E2E_OUTBOX: path.resolve("test-results/provider-outbox.jsonl"),
    },
  },
});
