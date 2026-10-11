import { describe, it, expect } from "vitest";
import { testDatabaseName } from "@/lib/test-database";
import { isCalendarDay } from "@/lib/calendar";
import { isoDateSchema, pledgeSchema } from "@/lib/validations/finance";
import { updateProfileSchema } from "@/lib/validations/user";
import { lagosDayStart, parseLagosDateTime } from "@/lib/tz";
import { pledgeDisplayStatus, pledgeStatusWhere } from "@/lib/finance/pledges";
import { parsePageParams, pageMeta, resolvePage } from "@/lib/pagination";
import { normalizeSearchParams } from "@/lib/search-params";
import { paymentDataSchema, toKobo } from "@/lib/finance/payment-data";
import { Prisma } from "@prisma/client";

describe("destructive test authorization", () => {
  it.each([
    "postgresql://user_test:pw@localhost/agwuse",
    "postgresql://user:pw_test@localhost/agwuse?test=_test",
    "postgresql://user:pw@localhost/agwuse_test_backup",
    "postgresql://user:pw@localhost/agwuse_test/other",
    "https://localhost/agwuse_test",
  ])("rejects deceptive database URL %s", (url) => {
    expect(() => testDatabaseName({ TEST_DATABASE_URL: url, ALLOW_TEST_DATABASE_RESET: "true" })).toThrow();
  });
  it("requires an explicit URL and reset authorization", () => {
    expect(() => testDatabaseName({ DATABASE_URL: "postgresql://localhost/agwuse_test" })).toThrow();
    expect(() => testDatabaseName({ TEST_DATABASE_URL: "postgresql://localhost/agwuse_test" })).toThrow();
    expect(testDatabaseName({ TEST_DATABASE_URL: "postgresql://localhost/agwuse_test", ALLOW_TEST_DATABASE_RESET: "true" })).toBe("agwuse_test");
  });
});

describe("strict dates and pledge day boundaries", () => {
  it.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-00-10"])("rejects %s across validators", (day) => {
    expect(isCalendarDay(day)).toBe(false);
    expect(isoDateSchema.safeParse(day).success).toBe(false);
    expect(lagosDayStart(day)).toBeNull();
    expect(parseLagosDateTime(`${day}T10:30`)).toBeNull();
    expect(updateProfileSchema.safeParse({ firstName: "Test", lastName: "Person", dateOfBirth: day }).success).toBe(false);
  });
  it("accepts leap days, rejects invalid times, and forbids reversed pledges", () => {
    expect(isCalendarDay("2024-02-29")).toBe(true);
    expect(parseLagosDateTime("2026-10-08T24:00")).toBeNull();
    expect(pledgeSchema.safeParse({ title: "Building", amount: "100", memberId: "member", startDate: "2026-10-09", endDate: "2026-10-08" }).success).toBe(false);
  });
  it("allows optional profile fields to be cleared", () => {
    const result = updateProfileSchema.parse({ firstName: " Test ", lastName: " Person ", gender: "none", maritalStatus: "", dateOfBirth: "" });
    expect(result).toMatchObject({ firstName: "Test", gender: null, maritalStatus: null, directoryShowEmail: false, directoryShowPhone: false });
  });
  it("overdue begins after the due calendar day ends in Lagos", () => {
    const pledge = { status: "ACTIVE" as const, endDate: new Date("2026-10-08T00:00:00Z") };
    expect(pledgeDisplayStatus(pledge, new Date("2026-10-08T22:59:59.999Z"))).toBe("ACTIVE");
    expect(pledgeDisplayStatus(pledge, new Date("2026-10-08T23:00:00Z"))).toBe("OVERDUE");
    expect(pledgeDisplayStatus({ ...pledge, status: "CANCELLED" })).toBe("CANCELLED");
    expect(pledgeStatusWhere("OVERDUE", new Date("2026-10-08T23:00:00Z"))).toMatchObject({ endDate: { lt: new Date("2026-10-09T00:00:00Z") } });
  });
});

describe("query and payment boundaries", () => {
  it.each(["3abc", "1.5", "999999999999999999999999"])("normalizes unsafe page %s", (page) => expect(parsePageParams({ page }).page).toBe(1));
  it("rejects repeated scalars and resolves out-of-range pages before fetching", () => {
    expect(normalizeSearchParams(new URLSearchParams("type=TITHE&type=EXPENSE"))).toEqual({ type: undefined });
    expect(parsePageParams({ page: ["2", "3"] }).page).toBe(1);
    expect(resolvePage(parsePageParams({ page: "500", pageSize: "10" }), 12)).toMatchObject({ page: 2, skip: 10 });
    expect(pageMeta({ page: 500, pageSize: 10, totalItems: 0 }).hasPrevPage).toBe(false);
  });
  it.each([0, -1, 99999.5, NaN, Infinity])("rejects invalid kobo %s", (amount) => expect(paymentDataSchema.safeParse({ reference: "AGW_test123", amount, currency: "NGN" }).success).toBe(false));
  it("converts decimal money to exact integer kobo", () => {
    expect(toKobo(new Prisma.Decimal("999.99"))).toBe(99999);
    expect(toKobo(new Prisma.Decimal("1000.00"))).toBe(100000);
    expect(() => toKobo(new Prisma.Decimal("1.001"))).toThrow();
  });
});
