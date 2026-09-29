"use server";

import { prisma } from "@/lib/prisma";
import { OfferingCategory } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { transactionSchema, pledgeSchema } from "@/lib/validations/finance";
import { recordTransaction, scheduleReceiptEmail } from "@/lib/finance/record-transaction";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";

export async function createTransaction(formData: FormData) {
  const session = await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const raw = {
    type: formData.get("type") as string,
    amount: formData.get("amount") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    date: formData.get("date") as string,
    memberId: formData.get("memberId") as string,
    offeringCategory: formData.get("offeringCategory") as string,
    categoryId: formData.get("categoryId") as string,
    referenceNumber: formData.get("referenceNumber") as string,
    notes: formData.get("notes") as string,
    pledgeId: formData.get("pledgeId") as string,
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const isExpense = data.type === "EXPENSE";
  // Expenses are never attributed to a member or credited to a pledge
  const memberId = isExpense ? null : data.memberId || null;
  const pledgeId = isExpense ? null : data.pledgeId || null;

  try {
    let expenseCategoryName: string | null = null;
    if (data.type === "EXPENSE" && data.categoryId) {
      const expCat = await prisma.financialCategory.findUnique({
        where: { id: data.categoryId },
        select: { name: true },
      });
      expenseCategoryName = expCat?.name || null;
    }

    const transaction = await prisma.$transaction(async (tx) => {
      return recordTransaction(tx, {
        type: data.type,
        amount: data.amount,
        currency: "NGN",
        paymentMethod: data.paymentMethod,
        date: data.date,
        memberId,
        category: (data.type === "OFFERING" ? data.offeringCategory || "GENERAL" : "GENERAL") as OfferingCategory,
        customCategory: isExpense ? expenseCategoryName : null,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
        pledgeId,
        recordedById: session.user.id,
        auditAction: "CREATE_TRANSACTION",
      });
    });

    // Only after the ledger row has committed
    scheduleReceiptEmail(transaction);

    revalidatePath("/admin");
    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/finance");
    revalidatePath("/finance/transactions");
    revalidatePath("/my-giving");
    revalidatePath("/dashboard");
    if (pledgeId) {
      revalidatePath(`/admin/finance/pledges/${pledgeId}`);
      revalidatePath(`/finance/pledges/${pledgeId}`);
      revalidatePath("/admin/finance/pledges");
      revalidatePath("/finance/pledges");
    }

    return { success: true, receiptNumber: transaction.receiptNumber };
  } catch (err: unknown) {
    console.error("createTransaction error:", err);
    // Pledge rule violations carry messages that are safe and useful to show
    if (err instanceof Error && /pledge/i.test(err.message)) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Failed to record transaction. Please try again." };
  }
}

export async function createPledge(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    amount: formData.get("amount") as string,
    startDate: formData.get("startDate") as string,
    endDate: (formData.get("endDate") as string) || null,
    memberId: formData.get("memberId") as string,
  };

  const parsed = pledgeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const pledge = await prisma.pledge.create({
      data: {
        title: data.title,
        amount: data.amount,
        amountPaid: 0,
        startDate: data.startDate,
        endDate: data.endDate || null,
        status: "ACTIVE",
        memberId: data.memberId,
      },
    });

    await writeAuditLog({
      action: "CREATE_PLEDGE",
      entity: "Pledge",
      entityId: pledge.id,
      userId: session.user.id,
      details: {
        title: data.title,
        amount: data.amount.toString(),
        memberId: data.memberId,
      },
    });

    revalidatePath("/admin/finance/pledges");
    revalidatePath("/finance/pledges");
    revalidatePath("/my-giving");

    return { success: true, data: { id: pledge.id } };
  } catch (err) {
    console.error("createPledge error:", err);
    return { success: false, error: "Failed to create pledge. Please try again." };
  }
}

export async function cancelPledge(pledgeId: string): Promise<ActionResult<void>> {
  const session = await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  try {
    const pledge = await prisma.pledge.findUnique({
      where: { id: pledgeId },
      select: { id: true, status: true, title: true, memberId: true },
    });

    if (!pledge) {
      return { success: false, error: "Pledge not found" };
    }

    if (pledge.status !== "ACTIVE") {
      return { success: false, error: `Cannot cancel a pledge that is ${pledge.status.toLowerCase()}` };
    }

    // Conditional update: a payment that fulfils the pledge concurrently wins
    const cancelled = await prisma.pledge.updateMany({
      where: { id: pledgeId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    if (cancelled.count === 0) {
      return { success: false, error: "This pledge changed while you were cancelling it. Please refresh." };
    }

    await writeAuditLog({
      action: "CANCEL_PLEDGE",
      entity: "Pledge",
      entityId: pledgeId,
      userId: session.user.id,
      details: {
        title: pledge.title,
        memberId: pledge.memberId,
      },
    });

    revalidatePath("/admin/finance/pledges");
    revalidatePath(`/admin/finance/pledges/${pledgeId}`);
    revalidatePath("/finance/pledges");
    revalidatePath(`/finance/pledges/${pledgeId}`);
    revalidatePath("/my-giving");

    return { success: true };
  } catch (err) {
    console.error("cancelPledge error:", err);
    return { success: false, error: "Failed to cancel pledge. Please try again." };
  }
}

export async function getMemberActivePledges(memberId: string) {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  if (!memberId) return [];

  const pledges = await prisma.pledge.findMany({
    where: {
      memberId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      amount: true,
      amountPaid: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return pledges.map((p) => ({
    id: p.id,
    title: p.title,
    amount: Number(p.amount),
    amountPaid: Number(p.amountPaid),
    remaining: Math.max(0, Number(p.amount) - Number(p.amountPaid)),
  }));
}
