"use server";

import { prisma } from "@/lib/prisma";
import { OfferingCategory } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { transactionSchema, pledgeSchema } from "@/lib/validations/finance";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { auditLog } from "@/lib/actions/admin-actions";
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
        memberId: data.memberId || null,
        category: (data.offeringCategory || "GENERAL") as OfferingCategory,
        customCategory: data.type === "EXPENSE" ? expenseCategoryName : null,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
        pledgeId: data.pledgeId || null,
        recordedById: session.user.id,
        auditAction: "CREATE_TRANSACTION",
      });
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/transactions");
    revalidatePath("/finance");
    revalidatePath("/my-giving");

    return { success: true, receiptNumber: transaction.receiptNumber };
  } catch (err: unknown) {
    console.error("createTransaction error:", err);
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

    await auditLog({
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

    await prisma.pledge.update({
      where: { id: pledgeId },
      data: { status: "CANCELLED" },
    });

    await auditLog({
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
