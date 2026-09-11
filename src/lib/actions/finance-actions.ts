"use server";

import { prisma } from "@/lib/prisma";
import { OfferingCategory } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { transactionSchema, pledgeSchema } from "@/lib/validations/finance";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/finance");
    revalidatePath("/my-giving");

    return { success: true, receiptNumber: transaction.receiptNumber };
  } catch (err: unknown) {
    console.error("createTransaction error:", err);
    return { success: false, error: "Failed to record transaction. Please try again." };
  }
}

export async function createPledge(formData: FormData) {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    amount: formData.get("amount") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    memberId: formData.get("memberId") as string,
  };

  const parsed = pledgeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await prisma.pledge.create({
      data: {
        title: data.title,
        amount: data.amount,
        amountPaid: 0,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: "ACTIVE",
        memberId: data.memberId,
      },
    });

    revalidatePath("/admin/finance/pledges");

    return { success: true };
  } catch (err) {
    console.error("createPledge error:", err);
    return { success: false, error: "Failed to create pledge. Please try again." };
  }
}
