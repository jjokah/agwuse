import { prisma } from "@/lib/prisma";
import { parsePageParams, resolvePage, type SearchParamsLike } from "@/lib/pagination";
import { scalarParam } from "@/lib/search-params";
import type { Prisma } from "@prisma/client";

export function directoryWhere(query?: string): Prisma.UserWhereInput {
  const q = query?.trim().slice(0, 100);
  return { status: "ACTIVE", role: { not: "VISITOR" }, ...(q ? { OR: [
    { firstName: { contains: q, mode: "insensitive" } },
    { lastName: { contains: q, mode: "insensitive" } },
    { department: { name: { contains: q, mode: "insensitive" } } },
    { directoryShowEmail: true, email: { contains: q, mode: "insensitive" } },
    { directoryShowPhone: true, phone: { contains: q, mode: "insensitive" } },
  ] } : {}) };
}

export function getDirectoryPage(params: SearchParamsLike) {
  return prisma.$transaction(async (tx) => {
    const where = directoryWhere(scalarParam(params, "q"));
    const total = await tx.user.count({ where });
    const page = resolvePage(parsePageParams(params), total);
    const names = await tx.user.findMany({ where, select: {
      id: true, firstName: true, lastName: true, department: { select: { name: true } },
    }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { id: "asc" }], skip: page.skip, take: page.take });
    const ids = names.map((member) => member.id);
    const [emails, phones] = await Promise.all([
      tx.user.findMany({ where: { id: { in: ids }, directoryShowEmail: true }, select: { id: true, email: true } }),
      tx.user.findMany({ where: { id: { in: ids }, directoryShowPhone: true }, select: { id: true, phone: true } }),
    ]);
    const emailMap = new Map(emails.map((row) => [row.id, row.email]));
    const phoneMap = new Map(phones.map((row) => [row.id, row.phone]));
    return { total, ...page, members: names.map((row) => ({ ...row, email: emailMap.get(row.id), phone: phoneMap.get(row.id) })) };
  }, { isolationLevel: "RepeatableRead" });
}
