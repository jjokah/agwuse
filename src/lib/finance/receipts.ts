import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

/**
 * Computes the calendar year in the Africa/Lagos timezone for a given Date.
 */
export function getLagosYear(date: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
  });
  return parseInt(formatter.format(date), 10);
}

/**
 * Formats a sequence number into the AG standard receipt number:
 * AG-YYYY-NNNNN (5-digit padded, expanding if > 99999).
 */
export function formatReceipt(year: number, sequence: number): string {
  const padded = sequence.toString().padStart(5, "0");
  return `AG-${year}-${padded}`;
}

/**
 * Atomically increments and returns the next sequential receipt number for the year.
 * Runs inside the caller's Prisma transaction to ensure gapless, collision-free numbering.
 */
export async function nextReceiptNumber(
  tx: PrismaTx,
  date: Date = new Date(),
): Promise<string> {
  const year = getLagosYear(date);

  const rows = await tx.$queryRaw<Array<{ lastValue: number }>>`
    INSERT INTO "receipt_counters" ("year", "lastValue", "updatedAt")
    VALUES (${year}, 1, NOW())
    ON CONFLICT ("year")
    DO UPDATE SET "lastValue" = "receipt_counters"."lastValue" + 1, "updatedAt" = NOW()
    RETURNING "lastValue";
  `;

  const seq = rows[0]?.lastValue ?? 1;
  return formatReceipt(year, seq);
}
