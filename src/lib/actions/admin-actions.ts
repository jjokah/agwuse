"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, auth } from "@/lib/auth";
import { type UserRole } from "@/lib/constants";
import { canChangeRole, canManageUser } from "@/lib/authz/roles";
import { revokeSessions } from "@/lib/authz/revoke";
import { sendAccountApprovedEmail } from "@/lib/email/send";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type { Gender, MaritalStatus } from "@prisma/client";

export async function auditLog(
  actionOrObj: string | { action: string; entity: string; entityId: string; details?: string | Record<string, unknown>; userId?: string },
  entity?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const session = await auth();
  const userId = (typeof actionOrObj === "object" ? actionOrObj.userId : undefined) || session?.user?.id;
  if (!userId) return;

  if (typeof actionOrObj === "object") {
    const detailsStr =
      typeof actionOrObj.details === "string"
        ? actionOrObj.details
        : actionOrObj.details
          ? JSON.stringify(actionOrObj.details)
          : null;

    await prisma.auditLog.create({
      data: {
        action: actionOrObj.action,
        entity: actionOrObj.entity,
        entityId: actionOrObj.entityId,
        details: detailsStr,
        userId,
      },
    });
  } else {
    await prisma.auditLog.create({
      data: {
        action: actionOrObj,
        entity: entity!,
        entityId: entityId!,
        details: details ? JSON.stringify(details) : null,
        userId,
      },
    });
  }
}

export async function approveUser(userId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, email: true, role: true, name: true, memberSince: true },
    });

    if (!user) return { success: false, error: "User not found" };
    if (user.status === "ACTIVE") return { success: false, error: "User already active" };

    // Check management permission
    const check = canManageUser(
      { id: session.user.id, role: session.user.role },
      { id: userId, role: user.role },
    );
    if (!check.allowed) return { success: false, error: check.reason };

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "ACTIVE",
        memberSince: user.memberSince || new Date(),
      },
    });

    await auditLog("APPROVE_USER", "User", userId, {
      email: user.email,
      previousStatus: user.status,
    });

    // Send account approved email asynchronously
    const triggerApprovedEmail = async () => {
      try {
        await sendAccountApprovedEmail(user.email, user.name || "Member");
      } catch (err) {
        console.error("Non-blocking approved email error:", err);
      }
    };

    if (typeof after === "function") {
      after(triggerApprovedEmail);
    } else {
      void triggerApprovedEmail();
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (err) {
    console.error("approveUser error:", err);
    return { success: false, error: "Failed to approve user." };
  }
}

export async function reactivateUser(userId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, email: true, role: true, name: true },
    });

    if (!user) return { success: false, error: "User not found" };
    if (user.status === "ACTIVE") return { success: false, error: "User is already active" };

    const check = canManageUser(
      { id: session.user.id, role: session.user.role },
      { id: userId, role: user.role },
    );
    if (!check.allowed) return { success: false, error: check.reason };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });
      await revokeSessions(tx, userId);
    });

    await auditLog("REACTIVATE_USER", "User", userId, {
      email: user.email,
      previousStatus: user.status,
    });

    const triggerReactivatedEmail = async () => {
      try {
        await sendAccountApprovedEmail(user.email, user.name || "Member");
      } catch (err) {
        console.error("Non-blocking reactivated email error:", err);
      }
    };

    if (typeof after === "function") {
      after(triggerReactivatedEmail);
    } else {
      void triggerReactivatedEmail();
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (err) {
    console.error("reactivateUser error:", err);
    return { success: false, error: "Failed to reactivate user." };
  }
}

export async function deactivateUser(userId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, email: true, role: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use the authorization rules
    const check = canManageUser(
      { id: session.user.id, role: session.user.role },
      { id: userId, role: user.role },
    );
    if (!check.allowed) return { success: false, error: check.reason };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: "INACTIVE" },
      });
      await revokeSessions(tx, userId);
    });

    await auditLog("DEACTIVATE_USER", "User", userId, {
      email: user.email,
      previousStatus: user.status,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (err) {
    console.error("deactivateUser error:", err);
    return { success: false, error: "Failed to deactivate user." };
  }
}

export async function changeUserRole(userId: string, newRole: UserRole) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Use the authorization rules
    const check = canChangeRole(
      { id: session.user.id, role: session.user.role },
      { id: userId, role: user.role },
      newRole,
    );
    if (!check.allowed) return { success: false, error: check.reason };

    // Prevent demoting the last SUPER_ADMIN
    if (user.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN", status: "ACTIVE" },
      });
      if (superAdminCount <= 1) {
        return { success: false, error: "Cannot demote the last Super Admin" };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await auditLog("CHANGE_ROLE", "User", userId, {
      email: user.email,
      previousRole: user.role,
      newRole,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (err) {
    console.error("changeUserRole error:", err);
    return { success: false, error: "Failed to change user role." };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    const check = canManageUser(
      { id: session.user.id, role: session.user.role },
      { id: userId, role: targetUser.role }
    );
    if (!check.allowed) return { success: false, error: check.reason };

    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const gender = (formData.get("gender") as Gender) || null;
    const maritalStatus = (formData.get("maritalStatus") as MaritalStatus) || null;
    const address = (formData.get("address") as string)?.trim() || null;
    const occupation = (formData.get("occupation") as string)?.trim() || null;
    const departmentId = (formData.get("departmentId") as string)?.trim() || null;

    const dobRaw = formData.get("dateOfBirth") as string;
    const dateOfBirth = dobRaw ? new Date(dobRaw) : null;

    const memberSinceRaw = formData.get("memberSince") as string;
    const memberSince = memberSinceRaw ? new Date(memberSinceRaw) : null;

    if (!firstName || !lastName) {
      return { success: false, error: "First name and last name are required" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone,
        gender,
        maritalStatus,
        address,
        occupation,
        dateOfBirth,
        memberSince,
        departmentId: departmentId === "none" ? null : departmentId,
      },
    });

    await auditLog("UPDATE_USER", "User", userId, {
      email: targetUser.email,
      updatedBy: session.user.id,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true };
  } catch (err) {
    console.error("updateUser error:", err);
    return { success: false, error: "Failed to update user details." };
  }
}

export async function assignUserToDepartment(userId: string, departmentId: string | null) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { departmentId },
    });

    revalidatePath("/admin/settings/departments");
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/departments");

    return { success: true };
  } catch (err) {
    console.error("assignUserToDepartment error:", err);
    return { success: false, error: "Failed to assign member to department." };
  }
}
