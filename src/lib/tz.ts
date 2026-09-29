/**
 * Church time-zone helpers.
 *
 * All wall-clock times in this app (event start times, "today", report day and
 * month boundaries, displayed dates) are Africa/Lagos time, whatever time zone
 * the server runs in (Vercel runs in UTC). Nigeria is fixed at UTC+1 with no
 * daylight saving, so a constant offset is exact.
 *
 * Date-only values (transaction date, pledge dates, date of birth) are stored as
 * UTC midnight of the chosen day, which is 01:00 the same day in Lagos, so they
 * render on the correct calendar day and fall inside the matching Lagos day range.
 */

export const CHURCH_TIME_ZONE = "Africa/Lagos";
export const LAGOS_UTC_OFFSET = "+01:00";
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** A Date whose UTC fields equal the Lagos wall-clock fields of `date`. */
function shiftToLagos(date: Date): Date {
  return new Date(date.getTime() + LAGOS_OFFSET_MS);
}

/** "YYYY-MM-DD" for the Lagos calendar day containing `date`. */
export function toLagosDateString(date: Date = new Date()): string {
  const d = shiftToLagos(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** "YYYY-MM-DDTHH:mm" Lagos wall-clock value for <input type="datetime-local">. */
export function toLagosDateTimeInputValue(date: Date): string {
  const d = shiftToLagos(date);
  return `${toLagosDateString(date)}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/**
 * Parses a Lagos wall-clock "YYYY-MM-DDTHH:mm[:ss]" (datetime-local) value.
 * Returns null for anything else.
 */
export function parseLagosDateTime(value: string | null | undefined): Date | null {
  const v = value?.trim();
  if (!v || !DATE_TIME_RE.test(v)) return null;
  const withSeconds = v.length === 16 ? `${v}:00` : v;
  const date = new Date(`${withSeconds}${LAGOS_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Start (inclusive) of a Lagos calendar day given as "YYYY-MM-DD". */
export function lagosDayStart(day: string): Date | null {
  if (!DATE_RE.test(day)) return null;
  const date = new Date(`${day}T00:00:00.000${LAGOS_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** End (inclusive, last millisecond) of a Lagos calendar day given as "YYYY-MM-DD". */
export function lagosDayEnd(day: string): Date | null {
  if (!DATE_RE.test(day)) return null;
  const date = new Date(`${day}T23:59:59.999${LAGOS_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** First instant of the Lagos month containing `date`. */
export function startOfLagosMonth(date: Date = new Date()): Date {
  const d = shiftToLagos(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - LAGOS_OFFSET_MS);
}

/** First instant of the Lagos year containing `date`. */
export function startOfLagosYear(date: Date = new Date()): Date {
  const d = shiftToLagos(date);
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1) - LAGOS_OFFSET_MS);
}

/** Lagos calendar parts of `date` (month is 1-12). */
export function lagosDateParts(date: Date): { year: number; month: number; day: number } {
  const d = shiftToLagos(date);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
