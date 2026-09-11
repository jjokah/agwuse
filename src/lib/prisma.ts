import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function getDatabasePoolMax(): number {
  const parsed = parseInt(process.env.DATABASE_POOL_MAX || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const pool = new pg.Pool({ connectionString, max: getDatabasePoolMax() });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
