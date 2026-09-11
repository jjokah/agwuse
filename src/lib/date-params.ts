import { z } from "zod/v4";

const MIN_DATE = new Date("2020-01-01");

/**
 * Parse and validate a date range from search params.
 *
 * Defaults:
 * - `from`: first day of the current month
 * - `to`: today
 *
 * Invalid dates are silently replaced with defaults.
 * `from` is clamped to not exceed `to`.
 */
export function parseDateRange(params: {
  from?: string | null;
  to?: string | null;
}): { from: Date; to: Date } {
  const now = new Date();
  const iso = z.iso.date();

  const toResult = iso.safeParse(params.to);
  const toDate = toResult.success ? new Date(toResult.data + "T23:59:59.999Z") : now;
  // Clamp to at most now
  const clampedTo = toDate > now ? now : toDate;

  const fromResult = iso.safeParse(params.from);
  const defaultFrom = new Date(clampedTo.getFullYear(), clampedTo.getMonth(), 1);
  const fromDate = fromResult.success ? new Date(fromResult.data + "T00:00:00.000Z") : defaultFrom;

  // Clamp from to at least MIN_DATE and at most to
  const clampedFrom = fromDate < MIN_DATE ? MIN_DATE : fromDate > clampedTo ? defaultFrom : fromDate;

  return { from: clampedFrom, to: clampedTo };
}
