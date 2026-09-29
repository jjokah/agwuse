import { describe, it, expect } from "vitest";
import { paystackInitializeSchema } from "@/lib/validations/finance";

const base = { email: "donor@example.com", amount: "5000" };

describe("paystackInitializeSchema", () => {
  it("accepts public giving types", () => {
    for (const type of ["TITHE", "OFFERING", "DONATION"]) {
      expect(paystackInitializeSchema.safeParse({ ...base, type }).success).toBe(true);
    }
  });

  it("rejects internal ledger types", () => {
    for (const type of ["EXPENSE", "PLEDGE_PAYMENT", "SOMETHING"]) {
      expect(paystackInitializeSchema.safeParse({ ...base, type }).success).toBe(false);
    }
  });

  it("rejects internal-only offering categories", () => {
    expect(
      paystackInitializeSchema.safeParse({ ...base, type: "OFFERING", offeringCategory: "SPECIAL" }).success,
    ).toBe(false);
    expect(
      paystackInitializeSchema.safeParse({ ...base, type: "OFFERING", offeringCategory: "MISSION" }).success,
    ).toBe(true);
  });
});
