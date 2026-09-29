import { describe, it, expect } from "vitest";
import {
  toLagosDateString,
  toLagosDateTimeInputValue,
  parseLagosDateTime,
  lagosDayStart,
  lagosDayEnd,
  startOfLagosMonth,
  startOfLagosYear,
} from "@/lib/tz";

describe("Africa/Lagos helpers", () => {
  it("treats datetime-local input as Lagos wall-clock time", () => {
    expect(parseLagosDateTime("2026-10-05T18:00")?.toISOString()).toBe("2026-10-05T17:00:00.000Z");
    expect(parseLagosDateTime("2026-10-05T18:00:30")?.toISOString()).toBe("2026-10-05T17:00:30.000Z");
  });

  it("rejects malformed datetime values", () => {
    for (const v of ["", "2026-10-05", "18:00", "2026-10-05 18:00", null, undefined]) {
      expect(parseLagosDateTime(v)).toBeNull();
    }
  });

  it("round-trips datetime-local values", () => {
    const d = parseLagosDateTime("2026-01-01T00:15")!;
    expect(toLagosDateTimeInputValue(d)).toBe("2026-01-01T00:15");
  });

  it("reports the Lagos calendar day just after midnight", () => {
    // 00:30 Lagos on Jan 1 is still Dec 31 in UTC
    expect(toLagosDateString(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });

  it("computes day, month and year boundaries in Lagos time", () => {
    expect(lagosDayStart("2026-03-10")?.toISOString()).toBe("2026-03-09T23:00:00.000Z");
    expect(lagosDayEnd("2026-03-10")?.toISOString()).toBe("2026-03-10T22:59:59.999Z");
    expect(lagosDayStart("not-a-date")).toBeNull();

    const lateUtc = new Date("2026-06-30T23:30:00Z"); // already July 1 in Lagos
    expect(startOfLagosMonth(lateUtc).toISOString()).toBe("2026-06-30T23:00:00.000Z");
    expect(startOfLagosYear(new Date("2026-12-31T23:30:00Z")).toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });
});
