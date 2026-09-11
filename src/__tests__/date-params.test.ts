import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseDateRange } from "@/lib/date-params";

describe("parseDateRange", () => {
  const realDate = new Date("2026-06-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(realDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns defaults when no params given", () => {
    const { from, to } = parseDateRange({});
    expect(to.getTime()).toBeLessThanOrEqual(realDate.getTime());
    expect(from.getMonth()).toBe(to.getMonth());
    expect(from.getDate()).toBe(1);
  });

  it("parses valid ISO dates", () => {
    const { from, to } = parseDateRange({ from: "2026-01-01", to: "2026-06-14" });
    expect(from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(to.toISOString()).toBe("2026-06-14T23:59:59.999Z");
  });

  it("falls back to defaults for invalid dates", () => {
    const { from, to } = parseDateRange({ from: "junk", to: "also-junk" });
    expect(to.getTime()).toBeLessThanOrEqual(realDate.getTime());
    expect(from.getDate()).toBe(1);
  });

  it("clamps 'from' to not exceed 'to'", () => {
    const { from, to } = parseDateRange({ from: "2026-12-01", to: "2026-06-01" });
    expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
  });

  it("clamps 'to' to not exceed today", () => {
    const { to } = parseDateRange({ to: "2099-01-01" });
    expect(to.getTime()).toBeLessThanOrEqual(realDate.getTime());
  });
});
