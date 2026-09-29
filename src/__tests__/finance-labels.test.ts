import { describe, it, expect } from "vitest";
import {
  TRANSACTION_TYPE_LABELS,
  OFFERING_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  PUBLIC_OFFERING_CATEGORIES,
  PUBLIC_GIVING_TYPES,
} from "@/lib/finance/labels";

// These values must match the Prisma schema enums exactly
const PRISMA_TRANSACTION_TYPES = ["TITHE", "OFFERING", "DONATION", "PLEDGE_PAYMENT", "EXPENSE"];
const PRISMA_OFFERING_CATEGORIES = [
  "GENERAL", "SPECIAL", "MISSION", "BUILDING_FUND", "WELFARE",
  "THANKSGIVING", "HARVEST", "FIRST_FRUIT", "OTHER",
];
const PRISMA_PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "POS", "MOBILE_MONEY", "ONLINE"];

describe("Finance label maps", () => {
  it("TRANSACTION_TYPE_LABELS covers all Prisma TransactionType values", () => {
    for (const t of PRISMA_TRANSACTION_TYPES) {
      expect(TRANSACTION_TYPE_LABELS[t]).toBeDefined();
      expect(typeof TRANSACTION_TYPE_LABELS[t]).toBe("string");
    }
  });

  it("OFFERING_CATEGORY_LABELS covers all Prisma OfferingCategory values", () => {
    for (const c of PRISMA_OFFERING_CATEGORIES) {
      expect(OFFERING_CATEGORY_LABELS[c]).toBeDefined();
      expect(typeof OFFERING_CATEGORY_LABELS[c]).toBe("string");
    }
  });

  it("PAYMENT_METHOD_LABELS covers all Prisma PaymentMethod values", () => {
    for (const m of PRISMA_PAYMENT_METHODS) {
      expect(PAYMENT_METHOD_LABELS[m]).toBeDefined();
      expect(typeof PAYMENT_METHOD_LABELS[m]).toBe("string");
    }
  });

  it("PUBLIC_OFFERING_CATEGORIES is a subset of OfferingCategory", () => {
    for (const c of PUBLIC_OFFERING_CATEGORIES) {
      expect(PRISMA_OFFERING_CATEGORIES).toContain(c);
    }
  });

  it("PUBLIC_GIVING_TYPES is a subset of TransactionType", () => {
    for (const t of PUBLIC_GIVING_TYPES) {
      expect(PRISMA_TRANSACTION_TYPES).toContain(t);
    }
  });

  it("PUBLIC_GIVING_TYPES excludes EXPENSE and PLEDGE_PAYMENT", () => {
    expect(PUBLIC_GIVING_TYPES).not.toContain("EXPENSE");
    expect(PUBLIC_GIVING_TYPES).not.toContain("PLEDGE_PAYMENT");
  });
});
