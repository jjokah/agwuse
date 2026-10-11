import { defineConfig } from "vitest/config";
import path from "path";
import { testDatabaseName } from "./src/lib/test-database";

const alias = { "@": path.resolve(import.meta.dirname, "./src") };

if (process.argv.some((arg) => arg === "integration" || arg === "--project=integration")) {
  testDatabaseName();
}

export default defineConfig({
  resolve: { alias },
  test: {
    passWithNoTests: false,
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          globals: true,
          maxWorkers: 2,
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          globals: true,
          include: ["src/**/*.int.test.ts"],
          env: {
            DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
            DIRECT_DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
          },
          // Suites share one database and truncate it: run files one at a time
          fileParallelism: false,
          sequence: { concurrent: false },
        },
      },
    ],
  },
});
