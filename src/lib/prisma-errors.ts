/**
 * Typed Prisma error helpers.
 *
 * Prisma client errors carry a `code` property, but the class itself
 * may not be importable everywhere, so we duck-type the check.
 */

function hasPrismaCode(err: unknown): err is Error & { code: string; meta?: Record<string, unknown> } {
  return err instanceof Error && "code" in err && typeof (err as { code: unknown }).code === "string";
}

/** P2002 — Unique constraint failed. */
export function isUniqueViolation(err: unknown): boolean {
  return hasPrismaCode(err) && err.code === "P2002";
}

/** P2025 — Record not found (e.g. delete/update on a missing row). */
export function isNotFound(err: unknown): boolean {
  return hasPrismaCode(err) && err.code === "P2025";
}
