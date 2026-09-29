"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface MemberSearchResult {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

/**
 * Server action to search church members by name, email, or phone.
 * Restricted to FINANCE, ADMIN, SUPER_ADMIN.
 * Requires at least 2 characters. Returns up to 20 results.
 */
export async function searchMembers(query: string): Promise<MemberSearchResult[]> {
  await requireRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);

  const q = query.trim();
  if (q.length < 2) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
    take: 20,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    phone: u.phone,
  }));
}
