/**
 * Authorization rules for role changes and user management.
 *
 * Pure functions — no DB calls, no imports from Prisma or Next.
 * The caller is responsible for supplying the correct context.
 */

/** Ordered list of roles from least to most privileged. */
export const ROLE_VALUES = [
  "VISITOR",
  "MEMBER",
  "DEPT_LEAD",
  "FINANCE",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type Role = (typeof ROLE_VALUES)[number];

const privileged = new Set<string>(["ADMIN", "SUPER_ADMIN"]);

function roleRank(role: string): number {
  const idx = ROLE_VALUES.indexOf(role as Role);
  return idx === -1 ? -1 : idx;
}

/**
 * Can `actor` change `target`'s role to `newRole`?
 *
 * Rules:
 * - Only a SUPER_ADMIN may assign ADMIN or SUPER_ADMIN.
 * - Only a SUPER_ADMIN may modify an existing ADMIN or SUPER_ADMIN.
 * - Nobody can change their own role.
 */
export function canChangeRole(
  actor: { id: string; role: string },
  target: { id: string; role: string },
  newRole: string,
): { allowed: boolean; reason?: string } {
  if (actor.id === target.id) {
    return { allowed: false, reason: "Cannot change your own role" };
  }

  // Modifying a privileged user requires SUPER_ADMIN
  if (privileged.has(target.role) && actor.role !== "SUPER_ADMIN") {
    return { allowed: false, reason: "Only a Super Admin can modify an Admin or Super Admin" };
  }

  // Assigning a privileged role requires SUPER_ADMIN
  if (privileged.has(newRole) && actor.role !== "SUPER_ADMIN") {
    return { allowed: false, reason: "Only a Super Admin can assign Admin or Super Admin roles" };
  }

  // Actor's rank must be at least as high as the target role they're assigning
  if (roleRank(actor.role) < roleRank(newRole)) {
    return { allowed: false, reason: "Cannot assign a role higher than your own" };
  }

  return { allowed: true };
}

/**
 * Can `actor` manage (deactivate / reactivate) `target`?
 */
export function canManageUser(
  actor: { id: string; role: string },
  target: { id: string; role: string },
): { allowed: boolean; reason?: string } {
  if (actor.id === target.id) {
    return { allowed: false, reason: "Cannot modify your own account status" };
  }

  // Only SUPER_ADMIN can manage ADMIN or SUPER_ADMIN users
  if (privileged.has(target.role) && actor.role !== "SUPER_ADMIN") {
    return { allowed: false, reason: "Only a Super Admin can manage Admin or Super Admin users" };
  }

  return { allowed: true };
}
