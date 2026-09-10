import { z } from "zod/v4";

export const transactionSchema = z.object({
  type: z.enum(["TITHE", "OFFERING", "DONATION", "PLEDGE_PAYMENT", "EXPENSE"]),
  amount: z.coerce.number().positive({ error: "Amount must be positive" }),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "POS", "MOBILE_MONEY", "ONLINE"]),
  date: z.string().min(1, { error: "Date is required" }),
  memberId: z.string().optional(),
  offeringCategory: z.string().optional(),
  categoryId: z.string().optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  pledgeId: z.string().optional(),
});

export const pledgeSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }).max(200),
  amount: z.coerce.number().positive({ error: "Amount must be positive" }),
  startDate: z.string().min(1, { error: "Start date is required" }),
  endDate: z.string().min(1, { error: "End date is required" }),
  memberId: z.string().min(1, { error: "Member is required" }),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type PledgeInput = z.infer<typeof pledgeSchema>;
