"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { after } from "next/server";
import { submissionSchema } from "@/lib/validations/submission";
import { sanitizeHtml } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { sendNewSubmissionEmail } from "@/lib/email/send";
import { getChurchInfo } from "@/lib/settings";

export async function submitPrayerRequest(formData: FormData) {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("submission_prayer", ip, 5, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const session = await auth();

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
    const sanitizedContent = sanitizeHtml(parsed.data.content);

    await prisma.submission.create({
      data: {
        type: "PRAYER_REQUEST",
        name: parsed.data.name.trim(),
        email: parsed.data.email || null,
        content: sanitizedContent,
        isPublic: parsed.data.isPublic,
        status: "PENDING",
        submittedById: session?.user?.id || null,
      },
    });

    const notifyAdmins = async () => {
      try {
        const churchInfo = await getChurchInfo();
        if (churchInfo.notificationEmails.length > 0) {
          await sendNewSubmissionEmail(churchInfo.notificationEmails, {
            type: "PRAYER_REQUEST",
            name: parsed.data.name.trim(),
            email: parsed.data.email || null,
            content: parsed.data.content,
            isPublic: parsed.data.isPublic,
          });
        }
      } catch (err) {
        console.error("Non-blocking prayer submission notification failed:", err);
      }
    };

    if (typeof after === "function") {
      after(notifyAdmins);
    } else {
      void notifyAdmins();
    }

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

  const session = await auth();

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
    const sanitizedContent = sanitizeHtml(parsed.data.content);

    await prisma.submission.create({
      data: {
        type: "TESTIMONY",
        name: parsed.data.name.trim(),
        email: parsed.data.email || null,
        content: sanitizedContent,
        isPublic: parsed.data.isPublic,
        status: "PENDING",
        submittedById: session?.user?.id || null,
      },
    });

    const notifyAdmins = async () => {
      try {
        const churchInfo = await getChurchInfo();
        if (churchInfo.notificationEmails.length > 0) {
          await sendNewSubmissionEmail(churchInfo.notificationEmails, {
            type: "TESTIMONY",
            name: parsed.data.name.trim(),
            email: parsed.data.email || null,
            content: parsed.data.content,
            isPublic: parsed.data.isPublic,
          });
        }
      } catch (err) {
        console.error("Non-blocking testimony submission notification failed:", err);
      }
    };

    if (typeof after === "function") {
      after(notifyAdmins);
    } else {
      void notifyAdmins();
    }

    return { success: true };
  } catch (err) {
    console.error("submitTestimony error:", err);
    return { success: false, error: "Failed to submit testimony. Please try again." };
  }
}
