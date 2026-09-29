/**
 * Paystack recording integration tests: real Prisma + PostgreSQL.
 * The webhook, the verify route and the /give/complete page can all record the
 * same payment at once; exactly one ledger row must result.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendGiftReceiptEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/email/send", () => ({ sendGiftReceiptEmail: mocks.sendGiftReceiptEmail }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (task: () => unknown) => {
    void Promise.resolve().then(task);
  },
}));

import { prisma } from "@/lib/prisma";
import { recordPaystackPayment } from "@/lib/finance/paystack";
import { resetDatabase, createUser } from "./helpers";

const REFERENCE = "AGW_0123456789abcdef0123456789abcdef";

async function createIntent(amount: number, overrides: Partial<{ type: "TITHE" | "OFFERING" | "DONATION"; memberId: string }> = {}) {
  return prisma.paymentIntent.create({
    data: {
      reference: REFERENCE,
      email: "donor@example.test",
      amount,
      currency: "NGN",
      type: overrides.type ?? "TITHE",
      category: "GENERAL",
      memberId: overrides.memberId ?? null,
    },
  });
}

const payment = (amount: number, reference = REFERENCE) => ({
  reference,
  amount,
  currency: "NGN",
  paid_at: "2026-03-10T09:30:00.000Z",
  customer: { email: "donor@example.test" },
  metadata: { intentRef: reference },
});

describe("Paystack recording (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
    mocks.sendGiftReceiptEmail.mockClear();
    await createUser("SUPER_ADMIN"); // system user that online payments are attributed to
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("records a payment exactly once when webhook, verify and return page race", async () => {
    await createIntent(5000, { type: "OFFERING" });

    const results = await Promise.all([
      recordPaystackPayment(payment(5000)),
      recordPaystackPayment(payment(5000)),
      recordPaystackPayment(payment(5000)),
    ]);

    expect(await prisma.financialTransaction.count()).toBe(1);
    const txn = await prisma.financialTransaction.findUniqueOrThrow({ where: { paystackRef: REFERENCE } });
    expect(txn).toMatchObject({ type: "OFFERING", paymentMethod: "ONLINE" });

    expect(results.filter((r) => r.status === "success")).toHaveLength(1);
    // Every caller can show the donor the same receipt number
    for (const r of results) {
      expect(r).toMatchObject({ receiptNumber: txn.receiptNumber });
    }

    const intent = await prisma.paymentIntent.findUniqueOrThrow({ where: { reference: REFERENCE } });
    expect(intent).toMatchObject({ status: "SUCCEEDED", transactionId: txn.id });

    await vi.waitFor(() => expect(mocks.sendGiftReceiptEmail).toHaveBeenCalledTimes(1));
  });

  it("uses the intent's type, never the processor payload, and links the member", async () => {
    const member = await createUser("MEMBER");
    await createIntent(2000, { type: "TITHE", memberId: member.id });

    const result = await recordPaystackPayment(payment(2000));

    expect(result.status).toBe("success");
    const txn = await prisma.financialTransaction.findFirstOrThrow();
    expect(txn).toMatchObject({ type: "TITHE", memberId: member.id });
  });

  it("refuses an amount that doesn't match the intent", async () => {
    await createIntent(5000);

    const result = await recordPaystackPayment(payment(50));

    expect(result.status).toBe("mismatch");
    expect(await prisma.financialTransaction.count()).toBe(0);
    expect((await prisma.paymentIntent.findUniqueOrThrow({ where: { reference: REFERENCE } })).status).toBe("FAILED");
    expect(await prisma.auditLog.count({ where: { action: "PAYSTACK_INTENT_MISMATCH" } })).toBe(1);
  });

  it("records an unmatched payment as a general donation", async () => {
    const result = await recordPaystackPayment(payment(1500, "EXTERNAL_REF_123456"));

    expect(result.status).toBe("success");
    const txn = await prisma.financialTransaction.findFirstOrThrow();
    expect(txn).toMatchObject({ type: "DONATION", category: "GENERAL", memberId: null });
    expect(await prisma.auditLog.count({ where: { action: "PAYSTACK_UNMATCHED" } })).toBe(1);
  });

  it("ignores non-NGN payments", async () => {
    await createIntent(5000);

    const result = await recordPaystackPayment({ ...payment(5000), currency: "USD" });

    expect(result.status).toBe("ignored");
    expect(await prisma.financialTransaction.count()).toBe(0);
  });
});
