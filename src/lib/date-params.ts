import { lagosDayEnd, lagosDayStart, startOfLagosMonth, toLagosDateString } from "@/lib/tz";

/** Earliest date a report may start from (Lagos time). */
const MIN_DATE = lagosDayStart("2020-01-01")!;

/**
 * Parse and validate a date range ("YYYY-MM-DD" search params) as Lagos calendar days.
 *
 * Defaults:
 * - `from`: first day of the current Lagos month
 * - `to`: end of today (Lagos)
 *
 * Invalid dates are silently replaced with defaults.
 * `to` is clamped to the end of today and `from` to [MIN_DATE, to].
 *
 * The upper bound is the end of the Lagos day, not "now": date-only rows are
 * stored at UTC midnight, which for today is still in the future between
 * 00:00 and 01:00 Lagos time.
 */
export function parseDateRange(params: {
  from?: string | null;
  to?: string | null;
}): { from: Date; to: Date } {
  const endOfToday = lagosDayEnd(toLagosDateString(new Date()))!;

  const toDate = (params.to && lagosDayEnd(params.to)) || endOfToday;
  const clampedTo = toDate > endOfToday ? endOfToday : toDate;

  const defaultFrom = startOfLagosMonth(clampedTo);
  const fromDate = (params.from && lagosDayStart(params.from)) || defaultFrom;

  const clampedFrom = fromDate < MIN_DATE ? MIN_DATE : fromDate > clampedTo ? defaultFrom : fromDate;

  return { from: clampedFrom, to: clampedTo };
}
