"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { type UserRole } from "@/lib/constants";
import { canChangeRole, canManageUser, ROLE_VALUES } from "@/lib/authz/roles";
import { revokeSessions } from "@/lib/authz/revoke";
import { sendAccountApprovedEmail } from "@/lib/email/send";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { adminUpdateUserSchema } from "@/lib/validations/user";

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

    await writeAuditLog({
      action: "APPROVE_USER",
      entity: "User",
      entityId: userId,
      userId: session.user.id,
      details: {
        email: user.email,
        previousStatus: user.status,
      },
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

    await writeAuditLog({
      action: "REACTIVATE_USER",
      entity: "User",
      entityId: userId,
      userId: session.user.id,
      details: {
        email: user.email,
        previousStatus: user.status,
      },
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

class LastSuperAdminError extends Error {}

/**
 * Throws if removing `userId` from the active SUPER_ADMIN set would leave none.
 * Locks the active SUPER_ADMIN rows (FOR UPDATE) so two concurrent demotions or
 * deactivations cannot both pass the check.
 */
async function assertNotLastSuperAdmin(tx: Prisma.TransactionClient, userId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "users"
    WHERE "role" = 'SUPER_ADMIN' AND "status" = 'ACTIVE'
    FOR UPDATE
  `;
  if (rows.filter((r) => r.id !== userId).length === 0) {
    throw new LastSuperAdminError("At least one active Super Admin is required");
  }
}

/** Pages that list users or show their names (e.g. department leaders). */
function revalidateUserListings(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/directory");
  revalidatePath("/leaders");
  revalidatePath("/departments");
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
      if (user.role === "SUPER_ADMIN") {
        await assertNotLastSuperAdmin(tx, userId);
      }
      await tx.user.update({
        where: { id: userId },
        data: { status: "INACTIVE" },
      });
      await revokeSessions(tx, userId);
      await writeAuditLog(
        {
          action: "DEACTIVATE_USER",
          entity: "User",
          entityId: userId,
          userId: session.user.id,
          details: { email: user.email, previousStatus: user.status },
        },
        tx,
      );
    });

    revalidateUserListings(userId);
    return { success: true };
  } catch (err) {
    if (err instanceof LastSuperAdminError) return { success: false, error: err.message };
    console.error("deactivateUser error:", err);
    return { success: false, error: "Failed to deactivate user." };
  }
}

export async function changeUserRole(userId: string, newRole: UserRole) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  if (!(ROLE_VALUES as readonly string[]).includes(newRole)) {
    return { success: false, error: "Invalid role" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!user) return { success: false, error: "User not found" };
    if (user.role === newRole) return { success: true };

    // Use the authorization rules
    const check = canChangeRole(
      { id: session.user.id, role: session.user.role },
      { id: userId, role: user.role },
      newRole,
    );
    if (!check.allowed) return { success: false, error: check.reason };

    await prisma.$transaction(async (tx) => {
      // Prevent demoting the last SUPER_ADMIN (race-safe)
      if (user.role === "SUPER_ADMIN") {
        await assertNotLastSuperAdmin(tx, userId);
      }
      await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
      });
      // Existing sessions carry the old role in their JWT; force re-authentication
      await revokeSessions(tx, userId);
      await writeAuditLog(
        {
          action: "CHANGE_ROLE",
          entity: "User",
          entityId: userId,
          userId: session.user.id,
          details: { email: user.email, previousRole: user.role, newRole },
        },
        tx,
      );
    });

    revalidateUserListings(userId);
    return { success: true };
  } catch (err) {
    if (err instanceof LastSuperAdminError) {
      return { success: false, error: "Cannot demote the last Super Admin" };
    }
    console.error("changeUserRole error:", err);
    return { success: false, error: "Failed to change user role." };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const parsed = adminUpdateUserSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    phone: formData.get("phone") ?? undefined,
    address: formData.get("address") ?? undefined,
    occupation: formData.get("occupation") ?? undefined,
    gender: formData.get("gender") ?? undefined,
    maritalStatus: formData.get("maritalStatus") ?? undefined,
    departmentId: formData.get("departmentId") ?? undefined,
    dateOfBirth: formData.get("dateOfBirth") ?? undefined,
    memberSince: formData.get("memberSince") ?? undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

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

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...data,
          name: `${data.firstName} ${data.lastName}`,
        },
      });
      await writeAuditLog(
        {
          action: "UPDATE_USER",
          entity: "User",
          entityId: userId,
          userId: session.user.id,
          details: { email: targetUser.email, fields: Object.keys(data) },
        },
        tx,
      );
    });

    revalidateUserListings(userId);
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true };
  } catch (err) {
    console.error("updateUser error:", err);
    return { success: false, error: "Failed to update user details." };
  }
}

export async function assignUserToDepartment(userId: string, departmentId: string | null) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, departmentId: true },
    });
    if (!target) return { success: false, error: "User not found" };

    const check = canManageUser(
      { id: session.user.id, role: session.user.role },
      { id: userId, role: target.role },
    );
    if (!check.allowed) return { success: false, error: check.reason };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { departmentId },
      });
      await writeAuditLog(
        {
          action: "ASSIGN_DEPARTMENT",
          entity: "User",
          entityId: userId,
          userId: session.user.id,
          details: { email: target.email, from: target.departmentId, to: departmentId },
        },
        tx,
      );
    });

    revalidatePath("/admin/settings/departments", "layout");
    revalidateUserListings(userId);

    return { success: true };
  } catch (err) {
    console.error("assignUserToDepartment error:", err);
    return { success: false, error: "Failed to assign member to department." };
  }
}
