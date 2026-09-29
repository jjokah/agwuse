"use server";

import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revokeSessions } from "@/lib/authz/revoke";
import { writeAuditLog } from "@/lib/audit";
import { isOwnedAvatarUrl } from "@/lib/uploads/policy";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/user";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { after } from "next/server";
import { deleteOwnedBlobs } from "@/lib/uploads/cleanup";

export async function updateProfile(formData: FormData) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

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

  // `null` = field not submitted (keep current photo); "" = photo removed.
  const imageField = formData.get("image");
  const submittedImage = typeof imageField === "string" ? imageField.trim() : null;

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { firstName, lastName, phone, address, occupation, dateOfBirth, gender, maritalStatus } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true, profilePhoto: true },
    });
    const oldImage = existing?.image || existing?.profilePhoto || null;

    let nextImage = oldImage;
    if (submittedImage !== null && submittedImage !== oldImage) {
      // Only the user's own uploaded avatars may be stored; this also prevents
      // pointing at (and later deleting) someone else's blob.
      if (submittedImage && !isOwnedAvatarUrl(submittedImage, userId)) {
        return { success: false, error: "Please upload your profile photo using the upload button." };
      }
      nextImage = submittedImage || null;

      if (oldImage && isOwnedAvatarUrl(oldImage, userId)) {
        after(async () => {
          await deleteOwnedBlobs([oldImage]);
        });
      }
    }

    await prisma.user.update({
      where: { id: userId },
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
        image: nextImage,
        profilePhoto: nextImage,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { success: false, error: "Failed to update profile. Please try again." };
  }
}

export async function changePassword(formData: FormData) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Throttle per account as well as per IP (guessing the current password)
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("user_change_password", `${session.user.id}:${ip}`, 5, "15 m", 15 * 60_000);
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
    const userId = session.user.id;
    // Sign out every session (including this one) so a stolen session can't outlive the change
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
      await revokeSessions(tx, userId);
      await writeAuditLog(
        { action: "CHANGE_PASSWORD", entity: "User", entityId: userId, userId },
        tx,
      );
    });

    return { success: true };
  } catch (err) {
    console.error("changePassword error:", err);
    return { success: false, error: "Failed to update password. Please try again." };
  }
}
