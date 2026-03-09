"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod/v4";
import { formatReceiptNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AG-${year}-`;
  const lastTx = await prisma.financialTransaction.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const match = lastTx?.receiptNumber?.match(/-(\d{5})$/);
  const lastSeq = match ? parseInt(match[1], 10) : 0;
  return formatReceiptNumber(year, lastSeq + 1);
}

const transactionSchema = z.object({
  type: z.enum(["TITHE", "OFFERING", "DONATION", "PLEDGE_PAYMENT", "EXPENSE"]),
  amount: z.coerce.number().positive({ error: "Amount must be positive" }),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "POS", "MOBILE_MONEY", "ONLINE"]),
  date: z.string().min(1, { error: "Date is required" }),
  memberId: z.string().optional(),
  offeringCategory: z.string().optional(),
  categoryId: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  pledgeId: z.string().optional(),
});

export async function createTransaction(formData: FormData) {
  const session = await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const raw = {
    type: formData.get("type") as string,
    amount: formData.get("amount") as string,
    paymentMethod: formData.get("paymentMethod") as string,
    date: formData.get("date") as string,
    memberId: (formData.get("memberId") as string) || undefined,
    offeringCategory: (formData.get("offeringCategory") as string) || undefined,
    categoryId: (formData.get("categoryId") as string) || undefined,
    referenceNumber: (formData.get("referenceNumber") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
    pledgeId: (formData.get("pledgeId") as string) || undefined,
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const receiptNumber = await generateReceiptNumber();

  // Resolve expense category name if categoryId is provided
  let expenseCategoryName: string | null = null;
  if (data.type === "EXPENSE" && data.categoryId) {
    const expCat = await prisma.financialCategory.findUnique({
      where: { id: data.categoryId },
      select: { name: true },
    });
    expenseCategoryName = expCat?.name ?? null;
  }

  const transaction = await prisma.financialTransaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      currency: "NGN",
      paymentMethod: data.paymentMethod,
      date: new Date(data.date),
      memberId: data.memberId || null,
      category: (data.offeringCategory || "GENERAL") as "GENERAL" | "SPECIAL" | "MISSION" | "BUILDING_FUND" | "WELFARE" | "THANKSGIVING" | "HARVEST" | "FIRST_FRUIT" | "OTHER",
      customCategory: data.type === "EXPENSE" ? expenseCategoryName : null,
      referenceNumber: data.referenceNumber || null,
      notes: data.notes || null,
      pledgeId: data.pledgeId || null,
      receiptNumber,
      recordedById: session.user.id,
    },
  });

  // If pledge payment, update pledge amountPaid
  if (data.type === "PLEDGE_PAYMENT" && data.pledgeId) {
    const pledge = await prisma.pledge.findUnique({
      where: { id: data.pledgeId },
    });
    if (pledge) {
      const newAmountPaid = Number(pledge.amountPaid) + data.amount;
      await prisma.pledge.update({
        where: { id: data.pledgeId },
        data: {
          amountPaid: newAmountPaid,
          status: newAmountPaid >= Number(pledge.amount) ? "FULFILLED" : "ACTIVE",
        },
      });
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: "CREATE_TRANSACTION",
      entity: "FinancialTransaction",
      entityId: transaction.id,
      details: JSON.stringify({
        type: data.type,
        amount: data.amount,
        receiptNumber,
      }),
      userId: session.user.id,
    },
  });

  revalidatePath("/admin/finance");
  revalidatePath("/finance");
  revalidatePath("/my-giving");

  return { success: true, receiptNumber };
}

const pledgeSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }),
  amount: z.coerce.number().positive({ error: "Amount must be positive" }),
  startDate: z.string().min(1, { error: "Start date is required" }),
  endDate: z.string().min(1, { error: "End date is required" }),
  memberId: z.string().min(1, { error: "Member is required" }),
});

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

  await prisma.pledge.create({
    data: {
      title: data.title,
      amount: data.amount,
      amountPaid: 0,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: "ACTIVE",
      memberId: data.memberId,
    },
  });

  revalidatePath("/admin/finance/pledges");

  return { success: true };
}
