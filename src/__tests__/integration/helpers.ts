/**
 * Shared setup for *.int.test.ts suites. These run against a real PostgreSQL
 * database and TRUNCATE tables. Explicit reset opt-in, parsed URL validation,
 * and current_database() verification are required before every reset.
 */
import { randomUUID } from "crypto";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { testDatabaseName } from "@/lib/test-database";

export async function assertTestDatabase(): Promise<void> {
  const expected = testDatabaseName();
  if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error("Test connection differs from TEST_DATABASE_URL.");
  const rows = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (rows[0]?.name !== expected) throw new Error("Connected database does not match the authorized test database.");
}

/** Empties fixture tables only after verifying the disposable connection. */
export async function resetDatabase(): Promise<void> {
  await assertTestDatabase();
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "audit_logs", "payment_intents", "financial_transactions", "pledges",
       "receipt_counters", "financial_categories", "departments", "users", "tokens",
       "blog_posts", "events", "submissions", "gallery_images", "sermons", "live_stream_config" RESTART IDENTITY CASCADE`,
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
