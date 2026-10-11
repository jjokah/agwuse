import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ existing: vi.fn(), intent: vi.fn(), record: vi.fn(), receipt: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: async () => ({ id: "system" }) },
  financialTransaction: { findUnique: mocks.existing }, paymentIntent: { findUnique: mocks.intent },
  $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
} }));
vi.mock("@/lib/finance/record-transaction", () => ({ recordTransaction: mocks.record, scheduleReceiptEmail: mocks.receipt }));
import { recordPaystackPayment } from "@/lib/finance/paystack";
beforeEach(() => { vi.clearAllMocks(); mocks.existing.mockResolvedValue(null); mocks.intent.mockResolvedValue(null); });
afterEach(() => vi.restoreAllMocks());
const data = { reference: "AGW_recording_test", amount: 100000, currency: "NGN" };
describe("payment recording race failures", () => {
  it("logs database lookup failures with the payment reference", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.existing.mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(recordPaystackPayment(data)).rejects.toThrow("Database unavailable");
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({ event: "payment_recording_failed", reference: data.reference, reason: "Database unavailable" });
    expect(mocks.receipt).not.toHaveBeenCalled();
  });
  it("does not report success for an unrelated uniqueness conflict", async () => {
    mocks.record.mockRejectedValue(Object.assign(new Error("Unique constraint"), { code: "P2002" }));
    await expect(recordPaystackPayment(data)).rejects.toMatchObject({ code: "P2002" });
    expect(mocks.receipt).not.toHaveBeenCalled();
  });
  it("reports duplicate success only when the ledger winner exists", async () => {
    mocks.record.mockRejectedValue(Object.assign(new Error("Unique constraint"), { code: "P2002" }));
    mocks.existing.mockResolvedValueOnce(null).mockResolvedValueOnce({ receiptNumber: "AG-2026-00001" });
    expect(await recordPaystackPayment(data)).toEqual({ status: "already_processed", receiptNumber: "AG-2026-00001" });
  });
  it("rejects conflicting references before resolving an intent", async () => {
    expect((await recordPaystackPayment({ ...data, metadata: { intentRef: "different-reference" } })).status).toBe("mismatch");
    expect(mocks.intent).not.toHaveBeenCalled();
  });
});
