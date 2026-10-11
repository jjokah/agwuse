import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/client";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), count: vi.fn(), rows: vi.fn(), query: vi.fn(), reset: vi.fn(), reports: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireAuth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  financialTransaction: { count: mocks.count, findMany: mocks.rows },
  $transaction: async (fn: (tx: unknown) => unknown) => fn({ financialTransaction: { count: mocks.count, findMany: mocks.rows } }),
  $queryRaw: mocks.query, $executeRawUnsafe: mocks.reset,
} }));
vi.mock("@/lib/data/finance-reports", () => ({ getFinanceReportData: mocks.reports }));
vi.mock("@/lib/pdf", () => ({ buildReportPDFBuffer: vi.fn() }));
vi.mock("@/lib/settings", () => ({ getChurchInfo: vi.fn() }));
import { GET as givingExport } from "@/app/api/me/giving/export/route";
import { GET as financeExport } from "@/app/api/finance/reports/export/route";
import { GET as readiness } from "@/app/api/health/ready/route";
import { resetDatabase } from "./integration/helpers";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.auth.mockResolvedValue({ user: { id: "owner", role: "MEMBER" } });
  vi.stubEnv("TEST_DATABASE_URL", "postgresql://test@localhost/agwuse_test");
  vi.stubEnv("DATABASE_URL", "postgresql://test@localhost/agwuse_test");
  vi.stubEnv("ALLOW_TEST_DATABASE_RESET", "true");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const row = { id: "gift", date: new Date("2026-10-09T12:00:00Z"), receiptNumber: "RECEIPT", type: "TITHE", paymentMethod: "CASH", amount: new Decimal("1000.00"), member: null, customCategory: null, category: null, notes: null };
describe("export boundaries and authorization", () => {
  it("rejects unauthenticated downloads without fetching rows", async () => {
    mocks.auth.mockRejectedValue(new Error("Unauthorized"));
    expect((await givingExport(new NextRequest("http://localhost/api/me/giving/export"))).status).toBe(401);
    expect(mocks.count).not.toHaveBeenCalled();
  });
  it("rejects oversized member CSV visibly before fetching rows", async () => {
    mocks.count.mockResolvedValue(50_001);
    const response = await givingExport(new NextRequest("http://localhost/api/me/giving/export"));
    expect(response.status).toBe(413);
    expect((await response.json()).error).toContain("narrow the date range");
    expect(mocks.rows).not.toHaveBeenCalled();
  });
  it("allows exactly 50,000 giving rows with session ownership and no cache", async () => {
    mocks.count.mockResolvedValue(50_000); mocks.rows.mockResolvedValue(Array(50_000).fill(row));
    const response = await givingExport(new NextRequest("http://localhost/api/me/giving/export?memberId=someone-else&type=TITHE&type=EXPENSE"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.count.mock.calls[0][0].where.AND[0]).toEqual({ memberId: "owner", type: { not: "EXPENSE" }, voidedAt: null });
    expect(mocks.count.mock.calls[0][0].where.AND[1]).toEqual({});
    expect((await response.text()).split(/\r?\n/)).toHaveLength(50_001);
  });
  it("guards finance exports and rejects truncation at the CSV boundary", async () => {
    const request = new NextRequest("http://localhost/api/finance/reports/export");
    expect((await financeExport(request)).status).toBe(403);
    expect(mocks.reports).not.toHaveBeenCalled();
    mocks.auth.mockResolvedValue({ user: { id: "finance", role: "FINANCE" } });
    mocks.reports.mockResolvedValue({ transactions: Array(50_000).fill(row), transactionCount: 50_001 });
    expect((await financeExport(request)).status).toBe(413);
    mocks.reports.mockResolvedValue({ transactions: Array(50_000).fill(row), transactionCount: 50_000 });
    expect((await financeExport(request)).status).toBe(200);
  });
});
describe("database safety and readiness", () => {
  it("refuses truncation when the actual database differs", async () => {
    mocks.query.mockResolvedValue([{ name: "agwuse" }]);
    await expect(resetDatabase()).rejects.toThrow("Connected database");
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("refuses truncation without reset authorization", async () => {
    vi.stubEnv("ALLOW_TEST_DATABASE_RESET", "false");
    await expect(resetDatabase()).rejects.toThrow("ALLOW_TEST_DATABASE_RESET");
    expect(mocks.query).not.toHaveBeenCalled(); expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("returns healthy or unavailable without exposing connection errors", async () => {
    mocks.query.mockResolvedValue([{ value: 1 }]);
    const healthy = await readiness(); expect(await healthy.json()).toEqual({ status: "healthy" });
    mocks.query.mockRejectedValue(new Error("secret connection details"));
    const unavailable = await readiness(); expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toEqual({ status: "unavailable" });
    expect(unavailable.headers.get("Cache-Control")).toBe("no-store");
  });
  it("reports unavailable when connectivity succeeds but the release schema is missing", async () => {
    mocks.query.mockResolvedValueOnce([{ value: 1 }]).mockRejectedValueOnce(new Error('column "directoryShowEmail" does not exist'));
    const response = await readiness();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
    expect(console.error).toHaveBeenCalledWith(JSON.stringify({ event: "database_readiness_failed", check: "schema" }));
  });
});
