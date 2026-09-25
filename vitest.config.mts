import { defineConfig } from "vitest/config";
import path from "path";

const alias = { "@": path.resolve(import.meta.dirname, "./src") };

// Integration tests (*.int.test.ts) need a disposable database whose URL contains "_test".
const hasTestDb = (process.env.DATABASE_URL ?? "").includes("_test");

export default defineConfig({
  resolve: { alias },
  test: {
    // There are no integration suites yet; an empty project must not fail CI.
    passWithNoTests: true,
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          globals: true,
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
          // Without a test database, collect nothing instead of touching a real one.
          include: hasTestDb ? ["src/**/*.int.test.ts"] : [],
          // Suites share one database and truncate it: run files one at a time
          fileParallelism: false,
          sequence: { concurrent: false },
        },
      },
    ],
  },
});
