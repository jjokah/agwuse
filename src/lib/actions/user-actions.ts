"use server";

import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/user";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    occupation: formData.get("occupation") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    gender: (formData.get("gender") as string) || undefined,
    maritalStatus: (formData.get("maritalStatus") as string) || undefined,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { firstName, lastName, phone, address, occupation, dateOfBirth, gender, maritalStatus } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        address: address || null,
        occupation: occupation || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: (gender as "MALE" | "FEMALE") || null,
        maritalStatus: (maritalStatus as "SINGLE" | "MARRIED" | "WIDOWED" | "DIVORCED") || null,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { success: false, error: "Failed to update profile. Please try again." };
  }
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("user_change_password", ip, 5, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const raw = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return { success: false, error: "Account error" };
    }

    const isValid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    const passwordHash = await hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return { success: true };
  } catch (err) {
    console.error("changePassword error:", err);
    return { success: false, error: "Failed to update password. Please try again." };
  }
}
