"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  churchSettingsSchema,
  type ChurchSettingsKey,
} from "@/lib/settings/schema";
import type { ActionResult } from "@/lib/action-result";

export async function updateChurchSettingsAction(
  formData: FormData
): Promise<ActionResult<void>> {
  const sessionUser = await requireRole(["SUPER_ADMIN"]);

  const parseArrayField = (raw: unknown): string[] => {
    if (!raw || typeof raw !== "string") return [];
    return raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const rawInput = {
    church_name: formData.get("church_name"),
    church_short_name: formData.get("church_short_name"),
    church_tagline: formData.get("church_tagline"),
    church_address: formData.get("church_address"),
    church_phones: parseArrayField(formData.get("church_phones")),
    church_email: formData.get("church_email"),
    bank_name: formData.get("bank_name"),
    bank_account: formData.get("bank_account"),
    service_times: parseArrayField(formData.get("service_times")),
    notification_emails: parseArrayField(formData.get("notification_emails")),
  };

  const parsed = churchSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Validation failed";
    return { success: false, error: firstError };
  }

  const validData = parsed.data;

  try {
    const keys = Object.keys(validData) as ChurchSettingsKey[];

    await prisma.$transaction(async (tx) => {
      // Record before/after values so the audit trail shows what actually changed
      // (e.g. a bank account number edit), not just which keys were submitted.
      const previousRows = await tx.churchSettings.findMany({ where: { key: { in: keys } } });
      const previous = new Map(previousRows.map((r) => [r.key, r.value]));
      const changed = keys
        .map((key) => ({ key, from: previous.get(key) ?? null, to: JSON.stringify(validData[key]) }))
        .filter((c) => c.from !== c.to);

      for (const key of keys) {
        const valueJson = JSON.stringify(validData[key]);
        await tx.churchSettings.upsert({
          where: { key },
          create: { key, value: valueJson },
          update: { value: valueJson },
        });
      }

      await writeAuditLog(
        {
          action: "UPDATE_SETTINGS",
          entity: "ChurchSettings",
          entityId: "settings",
          details: { changedKeys: changed.map((c) => c.key), changes: changed },
          userId: sessionUser.user.id,
        },
        tx,
      );
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    console.error("updateChurchSettings error:", err);
    return { success: false, error: "Failed to save church settings" };
  }
}
