"use server";

import { prisma } from "@/lib/prisma";
import { submissionSchema } from "@/lib/validations/submission";
import { sanitizeHtml } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export async function submitPrayerRequest(formData: FormData) {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("submission_prayer", ip, 5, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    content: formData.get("content") as string,
    isPublic: formData.get("isPublic") === "true",
  };

  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.submission.create({
      data: {
        type: "PRAYER_REQUEST",
        name: parsed.data.name.trim(),
        email: parsed.data.email || null,
        content: sanitizeHtml(parsed.data.content),
        isPublic: parsed.data.isPublic,
        status: "PENDING",
      },
    });

    return { success: true };
  } catch (err) {
    console.error("submitPrayerRequest error:", err);
    return { success: false, error: "Failed to submit prayer request. Please try again." };
  }
}

export async function submitTestimony(formData: FormData) {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("submission_testimony", ip, 5, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    content: formData.get("content") as string,
    isPublic: formData.get("isPublic") === "true",
  };

  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.submission.create({
      data: {
        type: "TESTIMONY",
        name: parsed.data.name.trim(),
        email: parsed.data.email || null,
        content: sanitizeHtml(parsed.data.content),
        isPublic: parsed.data.isPublic,
        status: "PENDING",
      },
    });

    return { success: true };
  } catch (err) {
    console.error("submitTestimony error:", err);
    return { success: false, error: "Failed to submit testimony. Please try again." };
  }
}
