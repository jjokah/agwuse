import { describe, it, expect } from "vitest";
import { getLagosYear, formatReceipt } from "@/lib/finance/receipts";

describe("receipts helper", () => {
  describe("getLagosYear", () => {
    it("returns correct year for mid-year date", () => {
      const d = new Date("2026-06-15T12:00:00Z");
      expect(getLagosYear(d)).toBe(2026);
    });

    it("respects Lagos (UTC+1) timezone across New Year boundary", () => {
      // 2026-12-31 23:30 UTC is 2027-01-01 00:30 in Lagos!
      const nyeUtc = new Date("2026-12-31T23:30:00Z");
      expect(getLagosYear(nyeUtc)).toBe(2027);

      // 2026-12-31 22:30 UTC is 2026-12-31 23:30 in Lagos!
      const beforeMidnightUtc = new Date("2026-12-31T22:30:00Z");
      expect(getLagosYear(beforeMidnightUtc)).toBe(2026);
    });
  });

  describe("formatReceipt", () => {
    it("pads sequence with 5 digits", () => {
      expect(formatReceipt(2026, 1)).toBe("AG-2026-00001");
      expect(formatReceipt(2026, 42)).toBe("AG-2026-00042");
      expect(formatReceipt(2026, 99999)).toBe("AG-2026-99999");
    });

    it("allows expanding past 5 digits if needed", () => {
      expect(formatReceipt(2026, 100000)).toBe("AG-2026-100000");
    });
  });
});
