import { describe, it, expect } from "vitest";
import { transactionSchema } from "@/lib/validations/finance";
import { expenseCategoryLabel } from "@/lib/finance/labels";
import { buildTransactionWhere } from "@/lib/finance/transaction-filters";

const base = { amount: "1000", paymentMethod: "CASH", date: "2026-03-10" };

describe("transactionSchema pledge/member rules", () => {
  it("requires a member when a pledge is linked", () => {
    const r = transactionSchema.safeParse({ ...base, type: "OFFERING", pledgeId: "p1" });
    expect(r.success).toBe(false);
  });

  it("requires a pledge for PLEDGE_PAYMENT", () => {
    const r = transactionSchema.safeParse({ ...base, type: "PLEDGE_PAYMENT", memberId: "m1" });
    expect(r.success).toBe(false);
  });

  it("accepts a pledge payment with member and pledge", () => {
    const r = transactionSchema.safeParse({
      ...base,
      type: "PLEDGE_PAYMENT",
      memberId: "m1",
      pledgeId: "p1",
    });
    expect(r.success).toBe(true);
  });

  it("does not reject expenses with stale member/pledge state (the action strips them)", () => {
    const r = transactionSchema.safeParse({ ...base, type: "EXPENSE", pledgeId: "p1" });
    expect(r.success).toBe(true);
  });
});

describe("expenseCategoryLabel", () => {
  it("uses the stored category name and falls back to Uncategorized", () => {
    expect(expenseCategoryLabel("Utilities")).toBe("Utilities");
    expect(expenseCategoryLabel("  ")).toBe("Uncategorized");
    expect(expenseCategoryLabel(null)).toBe("Uncategorized");
  });
});

describe("buildTransactionWhere", () => {
  it("ignores unknown enum values and malformed dates instead of throwing", () => {
    expect(buildTransactionWhere({ type: "BOGUS", method: "BITCOIN", from: "junk", to: "2026-13-99" })).toEqual({});
  });

  it("filters whole Lagos days", () => {
    const where = buildTransactionWhere({ type: "TITHE", from: "2026-03-10", to: "2026-03-10" });
    expect(where.type).toBe("TITHE");
    expect(where.date).toEqual({
      gte: new Date("2026-03-09T23:00:00.000Z"),
      lte: new Date("2026-03-10T22:59:59.999Z"),
    });
  });
});
