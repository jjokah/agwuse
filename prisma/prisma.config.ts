import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_DATABASE_URL
      ?? process.env.DATABASE_URL
      ?? "postgresql://agwuse:agwuse_dev_2026@localhost:5433/agwuse",
  },
});
