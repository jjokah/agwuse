/** Reject impossible calendar days rather than accepting JavaScript's rollover. */
export function isCalendarDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isStrictIsoDate(value: string): boolean {
  if (!isCalendarDay(value.slice(0, 10))) return false;
  if (value.length === 10) return true;
  // Explicit UTC prevents server-local interpretation of date-time inputs.
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/.test(value);
}
