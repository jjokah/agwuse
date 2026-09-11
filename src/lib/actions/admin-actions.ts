"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, auth } from "@/lib/auth";
import { type UserRole } from "@/lib/constants";
import { canChangeRole, canManageUser } from "@/lib/authz/roles";
import { revalidatePath } from "next/cache";

async function auditLog(
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, unknown>
) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      details: JSON.stringify(details),
      userId: session.user.id,
    },
  });
}

export async function approveUser(userId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, email: true, role: true },
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
        memberSince: user.status === "PENDING" ? new Date() : undefined,
      },
    });

    await auditLog("APPROVE_USER", "User", userId, {
      email: user.email,
      previousStatus: user.status,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error("approveUser error:", err);
    return { success: false, error: "Failed to approve user." };
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

    await prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
    });

    await auditLog("DEACTIVATE_USER", "User", userId, {
      email: user.email,
      previousStatus: user.status,
    });

    revalidatePath("/admin/users");
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
    return { success: true };
  } catch (err) {
    console.error("changeUserRole error:", err);
    return { success: false, error: "Failed to change user role." };
  }
}
