import { describe, it, expect } from "vitest";
import { isUniqueViolation, isNotFound } from "@/lib/prisma-errors";

function makePrismaError(code: string): Error & { code: string } {
  const err = new Error(`Prisma error ${code}`) as Error & { code: string };
  err.code = code;
  return err;
}

describe("isUniqueViolation", () => {
  it("returns true for P2002", () => {
    expect(isUniqueViolation(makePrismaError("P2002"))).toBe(true);
  });

  it("returns false for other Prisma codes", () => {
    expect(isUniqueViolation(makePrismaError("P2025"))).toBe(false);
  });

  it("returns false for plain errors", () => {
    expect(isUniqueViolation(new Error("Unique constraint"))).toBe(false);
  });

  it("returns false for non-errors", () => {
    expect(isUniqueViolation("string")).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

describe("isNotFound", () => {
  it("returns true for P2025", () => {
    expect(isNotFound(makePrismaError("P2025"))).toBe(true);
  });

  it("returns false for P2002", () => {
    expect(isNotFound(makePrismaError("P2002"))).toBe(false);
  });
});
