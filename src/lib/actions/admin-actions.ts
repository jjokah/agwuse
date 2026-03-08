"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { auth } from "@/lib/auth";

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
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, email: true },
  });

  if (!user) return { success: false, error: "User not found" };
  if (user.status === "ACTIVE") return { success: false, error: "User already active" };

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });

  await auditLog("APPROVE_USER", "User", userId, {
    email: user.email,
    previousStatus: user.status,
  });

  return { success: true };
}

export async function deactivateUser(userId: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, email: true, role: true },
  });

  if (!user) return { success: false, error: "User not found" };
  if (user.role === "SUPER_ADMIN") {
    return { success: false, error: "Cannot deactivate a Super Admin" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "INACTIVE" },
  });

  await auditLog("DEACTIVATE_USER", "User", userId, {
    email: user.email,
    previousStatus: user.status,
  });

  return { success: true };
}

export async function changeUserRole(
  userId: string,
  newRole: "VISITOR" | "MEMBER" | "DEPT_LEAD" | "FINANCE" | "ADMIN" | "SUPER_ADMIN"
) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  if (!user) return { success: false, error: "User not found" };

  // Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN roles
  if (
    (newRole === "SUPER_ADMIN" || newRole === "ADMIN") &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return { success: false, error: "Only Super Admin can assign this role" };
  }

  // Prevent removing own SUPER_ADMIN role
  if (userId === session.user.id && user.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
    return { success: false, error: "Cannot remove your own Super Admin role" };
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

  return { success: true };
}
