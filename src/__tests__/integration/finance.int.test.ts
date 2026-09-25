/**
 * Finance ledger integration tests: real Prisma + PostgreSQL, real server
 * actions. Only the session, cache revalidation and email delivery are mocked.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import type { User } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } & Record<string, unknown> },
  sendGiftReceiptEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => mocks.session),
  requireAuth: vi.fn(async () => {
    if (!mocks.session) throw new Error("Unauthorized");
    return mocks.session;
  }),
  requireRole: vi.fn(async (roles: string[]) => {
    if (!mocks.session) throw new Error("Unauthorized");
    if (!roles.includes(mocks.session.user.role)) throw new Error("Forbidden");
    return mocks.session;
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/email/send", () => ({ sendGiftReceiptEmail: mocks.sendGiftReceiptEmail }));
// Run after() callbacks right away (there is no request scope in tests)
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (task: () => unknown) => {
    void Promise.resolve().then(task);
  },
}));

import { prisma } from "@/lib/prisma";
import { createTransaction, cancelPledge } from "@/lib/actions/finance-actions";
import { voidTransaction } from "@/lib/finance/queries";
import { resetDatabase, createUser, sessionFor, formData } from "./helpers";

const DATE = "2026-03-10";

async function makePledge(member: User, amount: number) {
  return prisma.pledge.create({
    data: { title: `Pledge ${amount}`, amount, startDate: new Date(DATE), memberId: member.id },
  });
}

async function recordPledgePayment(member: User, pledgeId: string, amount: string) {
  const result = await createTransaction(
    formData({
      type: "PLEDGE_PAYMENT",
      amount,
      paymentMethod: "CASH",
      date: DATE,
      memberId: member.id,
      pledgeId,
    }),
  );
  expect(result).toMatchObject({ success: true });
  return prisma.financialTransaction.findUniqueOrThrow({
    where: { receiptNumber: (result as { receiptNumber: string }).receiptNumber },
  });
}

describe("finance ledger (integration)", () => {
  let finance: User;
  let member: User;
  let otherMember: User;

  beforeEach(async () => {
    await resetDatabase();
    mocks.sendGiftReceiptEmail.mockClear();
    finance = await createUser("FINANCE");
    member = await createUser("MEMBER");
    otherMember = await createUser("MEMBER");
    mocks.session = sessionFor(finance);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("allocates unique, gapless receipt numbers under concurrency", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        createTransaction(formData({ type: "OFFERING", amount: "100", paymentMethod: "CASH", date: DATE })),
      ),
    );

    expect(results.every((r) => r.success)).toBe(true);
    const receipts = results.map((r) => (r as { receiptNumber: string }).receiptNumber).sort();
    expect(receipts).toEqual(Array.from({ length: 8 }, (_, i) => `AG-2026-${String(i + 1).padStart(5, "0")}`));
  });

  it("fulfils a pledge, and voiding the payment reopens it with amountPaid restored", async () => {
    const pledge = await makePledge(member, 10_000);
    const payment = await recordPledgePayment(member, pledge.id, "10000");

    expect(await prisma.pledge.findUniqueOrThrow({ where: { id: pledge.id } })).toMatchObject({
      status: "FULFILLED",
    });

    const voided = await voidTransaction(payment.id, "Entered in error");
    expect(voided).toEqual({ success: true });

    const after = await prisma.pledge.findUniqueOrThrow({ where: { id: pledge.id } });
    expect(after.status).toBe("ACTIVE");
    expect(after.amountPaid.toNumber()).toBe(0);
    expect(await prisma.auditLog.count({ where: { action: "VOID_TRANSACTION", entityId: payment.id } })).toBe(1);
  });

  it("keeps a cancelled pledge cancelled when one of its payments is voided", async () => {
    const pledge = await makePledge(member, 8_000);
    const payment = await recordPledgePayment(member, pledge.id, "3000");

    expect(await cancelPledge(pledge.id)).toEqual({ success: true });
    expect(await voidTransaction(payment.id, "Refunded")).toEqual({ success: true });

    const after = await prisma.pledge.findUniqueOrThrow({ where: { id: pledge.id } });
    expect(after.status).toBe("CANCELLED");
    expect(after.amountPaid.toNumber()).toBe(0);
  });

  it("lets only one of two concurrent voids win and reverses the pledge once", async () => {
    const pledge = await makePledge(member, 10_000);
    await recordPledgePayment(member, pledge.id, "2000");
    const payment = await recordPledgePayment(member, pledge.id, "3000");

    const results = await Promise.all([
      voidTransaction(payment.id, "first"),
      voidTransaction(payment.id, "second"),
    ]);

    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.find((r) => !r.success)?.error).toBe("Transaction is already voided");
    const after = await prisma.pledge.findUniqueOrThrow({ where: { id: pledge.id } });
    expect(after.amountPaid.toNumber()).toBe(2000);
  });

  it("never attaches an expense to a member or pledge, even with stale form state", async () => {
    await prisma.financialCategory.create({ data: { name: "Utilities", type: "EXPENSE" } });
    const category = await prisma.financialCategory.findUniqueOrThrow({ where: { name: "Utilities" } });
    const pledge = await makePledge(member, 5_000);

    const result = await createTransaction(
      formData({
        type: "EXPENSE",
        amount: "750",
        paymentMethod: "CASH",
        date: DATE,
        categoryId: category.id,
        memberId: member.id, // left over from a previous selection in the form
        pledgeId: pledge.id,
      }),
    );
    expect(result.success).toBe(true);

    const expense = await prisma.financialTransaction.findFirstOrThrow({ where: { type: "EXPENSE" } });
    expect(expense).toMatchObject({ memberId: null, pledgeId: null, customCategory: "Utilities" });
    expect((await prisma.pledge.findUniqueOrThrow({ where: { id: pledge.id } })).amountPaid.toNumber()).toBe(0);
  });

  it("rolls back fully, with no receipt email, when the pledge belongs to someone else", async () => {
    const othersPledge = await makePledge(otherMember, 5_000);

    const result = await createTransaction(
      formData({
        type: "PLEDGE_PAYMENT",
        amount: "1000",
        paymentMethod: "CASH",
        date: DATE,
        memberId: member.id,
        pledgeId: othersPledge.id,
      }),
    );

    expect(result).toEqual({ success: false, error: "Pledge not found for this member" });
    expect(await prisma.financialTransaction.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);
    await new Promise((r) => setTimeout(r, 50));
    expect(mocks.sendGiftReceiptEmail).not.toHaveBeenCalled();

    // The rolled-back receipt number is not burned: the next receipt is still 00001
    const next = await createTransaction(
      formData({ type: "TITHE", amount: "100", paymentMethod: "CASH", date: DATE }),
    );
    expect(next).toMatchObject({ success: true, receiptNumber: "AG-2026-00001" });
  });

  it("sends the gift receipt email after commit, to the member", async () => {
    const result = await createTransaction(
      formData({ type: "TITHE", amount: "2500", paymentMethod: "BANK_TRANSFER", date: DATE, memberId: member.id }),
    );
    expect(result.success).toBe(true);

    await vi.waitFor(() => expect(mocks.sendGiftReceiptEmail).toHaveBeenCalledTimes(1));
    expect(mocks.sendGiftReceiptEmail).toHaveBeenCalledWith(
      member.email,
      expect.objectContaining({ receiptNumber: "AG-2026-00001", type: "Tithe" }),
    );
  });

  it("rejects callers without a finance role", async () => {
    mocks.session = sessionFor(member);
    await expect(
      createTransaction(formData({ type: "TITHE", amount: "100", paymentMethod: "CASH", date: DATE })),
    ).rejects.toThrow("Forbidden");
    expect(await prisma.financialTransaction.count()).toBe(0);
  });
});
