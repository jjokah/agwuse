import { defineConfig } from "vitest/config";
import path from "path";

const isTestDb = (process.env.DATABASE_URL ?? "").includes("_test");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          globals: true,
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["src/**/*.int.test.ts"],
        },
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
          },
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          globals: true,
          include: ["src/**/*.int.test.ts"],
          sequence: { concurrent: false },
          ...(isTestDb ? {} : { skip: true }),
        },
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
          },
        },
      },
    ],
  },
});
