import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseDateRange } from "@/lib/date-params";
import { toLagosDateString } from "@/lib/tz";

describe("parseDateRange", () => {
  const realDate = new Date("2026-06-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(realDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to the start of the current Lagos month through the end of today", () => {
    const { from, to } = parseDateRange({});
    expect(to.toISOString()).toBe("2026-06-15T22:59:59.999Z");
    expect(from.toISOString()).toBe("2026-05-31T23:00:00.000Z"); // Jun 1 00:00 Lagos
  });

  it("parses dates as whole Lagos calendar days", () => {
    const { from, to } = parseDateRange({ from: "2026-01-01", to: "2026-06-14" });
    expect(from.toISOString()).toBe("2025-12-31T23:00:00.000Z");
    expect(to.toISOString()).toBe("2026-06-14T22:59:59.999Z");
  });

  it("includes date-only rows (stored at UTC midnight) on the chosen day", () => {
    const { from, to } = parseDateRange({ from: "2026-03-10", to: "2026-03-10" });
    const stored = new Date("2026-03-10T00:00:00Z");
    expect(stored >= from && stored <= to).toBe(true);
    expect(new Date("2026-03-11T00:00:00Z") > to).toBe(true);
  });

  it("falls back to defaults for invalid dates", () => {
    const { from, to } = parseDateRange({ from: "junk", to: "also-junk" });
    expect(to.toISOString()).toBe("2026-06-15T22:59:59.999Z");
    expect(toLagosDateString(from)).toBe("2026-06-01");
  });

  it("clamps 'from' to not exceed 'to'", () => {
    const { from, to } = parseDateRange({ from: "2026-12-01", to: "2026-06-01" });
    expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
  });

  it("clamps 'to' to the end of today", () => {
    const { to } = parseDateRange({ to: "2099-01-01" });
    expect(to.toISOString()).toBe("2026-06-15T22:59:59.999Z");
  });

  it("includes a row dated today even just after Lagos midnight", () => {
    vi.setSystemTime(new Date("2026-09-24T23:30:00Z")); // 00:30 on Sep 25 in Lagos
    const { to } = parseDateRange({});
    expect(new Date("2026-09-25T00:00:00Z") <= to).toBe(true);
  });
});
