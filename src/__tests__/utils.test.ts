import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatReceiptNumber,
  slugify,
  truncate,
} from "@/lib/utils";

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats positive numbers in NGN", () => {
      const result = formatCurrency(5000);
      expect(result).toContain("5,000.00");
    });

    it("formats decimal amounts properly", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1,234.56");
    });

    it("handles zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0.00");
    });

    it("handles numeric strings", () => {
      const result = formatCurrency("2500");
      expect(result).toContain("2,500.00");
    });

    it("handles NaN and invalid input gracefully", () => {
      expect(formatCurrency("invalid")).toBe("₦0.00");
      expect(formatCurrency(NaN)).toBe("₦0.00");
      expect(formatCurrency(Infinity)).toBe("₦0.00");
    });
  });

  describe("formatDate", () => {
    it("formats valid Date objects", () => {
      const date = new Date("2026-01-15T00:00:00Z"); // date-only values are stored at UTC midnight
      expect(formatDate(date)).toBe("Jan 15, 2026");
    });

    it("uses church (Africa/Lagos) time, not the server's zone", () => {
      // 23:30 UTC on Dec 31 is already 00:30 on Jan 1 in Lagos
      expect(formatDate(new Date("2026-12-31T23:30:00Z"))).toBe("Jan 1, 2027");
    });

    it("formats ISO date strings", () => {
      expect(formatDate("2026-03-20T10:00:00Z")).toBe("Mar 20, 2026");
    });

    it("returns dash for null or undefined", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
    });

    it("returns dash for invalid dates", () => {
      expect(formatDate("invalid-date")).toBe("—");
    });
  });

  describe("formatDateTime", () => {
    it("formats date and time together", () => {
      const date = new Date("2026-05-10T13:30:00Z"); // 2:30 PM in Lagos (UTC+1)
      const result = formatDateTime(date);
      expect(result).toContain("May 10, 2026");
      expect(result).toContain("2:30 PM");
    });

    it("returns dash for null or undefined", () => {
      expect(formatDateTime(null)).toBe("—");
      expect(formatDateTime(undefined)).toBe("—");
    });
  });

  describe("formatReceiptNumber", () => {
    it("formats sequence with 5-digit padding", () => {
      expect(formatReceiptNumber(2026, 1)).toBe("AG-2026-00001");
      expect(formatReceiptNumber(2026, 42)).toBe("AG-2026-00042");
      expect(formatReceiptNumber(2026, 99999)).toBe("AG-2026-99999");
    });
  });

  describe("slugify", () => {
    it("converts spaces and symbols to hyphens", () => {
      expect(slugify("Sunday Service Highlights!")).toBe("sunday-service-highlights");
    });

    it("trims hyphens from ends", () => {
      expect(slugify("---Hello World---")).toBe("hello-world");
    });

    it("handles multiple consecutive spaces and dashes", () => {
      expect(slugify("Church   Welfare & Outreach")).toBe("church-welfare-outreach");
    });
  });

  describe("truncate", () => {
    it("returns original text if shorter than max length", () => {
      expect(truncate("Hello", 10)).toBe("Hello");
    });

    it("truncates text and appends ellipsis", () => {
      expect(truncate("This is a long description", 10)).toBe("This is a...");
    });
  });
});
