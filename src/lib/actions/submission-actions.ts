"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const submissionSchema = z.object({
  name: z.string().min(2, { error: "Name is required" }),
  email: z.email({ error: "Enter a valid email address" }).optional().or(z.literal("")),
  content: z.string().min(10, { error: "Please write at least 10 characters" }),
  isPublic: z.boolean().default(false),
});

export async function submitPrayerRequest(formData: FormData) {
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

  await prisma.submission.create({
    data: {
      type: "PRAYER_REQUEST",
      name: parsed.data.name,
      email: parsed.data.email || null,
      content: parsed.data.content,
      isPublic: parsed.data.isPublic,
      status: "PENDING",
    },
  });

  return { success: true };
}

export async function submitTestimony(formData: FormData) {
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

  await prisma.submission.create({
    data: {
      type: "TESTIMONY",
      name: parsed.data.name,
      email: parsed.data.email || null,
      content: parsed.data.content,
      isPublic: parsed.data.isPublic,
      status: "PENDING",
    },
  });

  return { success: true };
}
