/**
 * Shared setup for *.int.test.ts suites. These run against a real PostgreSQL
 * database and TRUNCATE tables, so they refuse to run unless DATABASE_URL
 * points at a database whose name contains "_test".
 */
import { randomUUID } from "crypto";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("_test")) {
    throw new Error("Integration tests must run against a *_test database (check DATABASE_URL).");
  }
}

/** Empties every table the finance flows touch. */
export async function resetDatabase(): Promise<void> {
  assertTestDatabase();
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "audit_logs", "payment_intents", "financial_transactions", "pledges",
       "receipt_counters", "financial_categories", "departments", "users" RESTART IDENTITY CASCADE`,
  );
}

export async function createUser(role: UserRole, overrides: { firstName?: string } = {}) {
  const id = `u_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  return prisma.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      passwordHash: "not-used-in-tests",
      firstName: overrides.firstName ?? role,
      lastName: "Tester",
      role,
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });
}

/** Shape returned by requireAuth()/requireRole(), for mocking @/lib/auth. */
export function sessionFor(user: { id: string; email: string; role: UserRole }) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: null,
      image: null,
      role: user.role,
      status: "ACTIVE",
      tokenVersion: 0,
    },
  };
}

export function formData(values: Record<string, string | null | undefined>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value != null) fd.set(key, value);
  }
  return fd;
}
