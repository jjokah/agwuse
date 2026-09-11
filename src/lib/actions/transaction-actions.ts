"use server";

import { revalidatePath } from "next/cache";
import { voidTransaction } from "@/lib/finance/queries";
import type { ActionResult } from "@/lib/action-result";

export async function voidTransactionAction(
  id: string,
  reason: string
): Promise<ActionResult<void>> {
  const result = await voidTransaction(id, reason);
  if (!result.success) {
    return { success: false, error: result.error || "Failed to void transaction" };
  }

  revalidatePath("/admin/finance/transactions");
  revalidatePath("/admin/finance");
  revalidatePath("/finance");
  revalidatePath("/my-giving");

  return { success: true };
}
