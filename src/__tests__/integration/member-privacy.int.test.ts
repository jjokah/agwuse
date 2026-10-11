import { beforeEach, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDirectoryPage } from "@/lib/data/directory";
import { givingWhere } from "@/lib/finance/giving-filters";
import { auditedMutation } from "@/lib/audited-mutation";
import { pledgeStatusWhere } from "@/lib/finance/pledges";
import { resetDatabase, createUser } from "./helpers";

beforeEach(resetDatabase);
afterAll(async () => { await prisma.$disconnect(); });
describe("member privacy and atomic writes", () => {
  it("hides contacts by default, excludes visitors, and cannot search private contacts", async () => {
    const member = await createUser("MEMBER", { firstName: "Private" });
    await prisma.user.update({ where: { id: member.id }, data: { phone: "080987654321" } });
    await createUser("VISITOR");
    const all = await getDirectoryPage({});
    expect(all.members).toHaveLength(1);
    expect(all.members[0]).toMatchObject({ email: undefined, phone: undefined });
    expect((await getDirectoryPage({ q: member.email })).total).toBe(0);
    expect((await getDirectoryPage({ q: "080987654321" })).total).toBe(0);
    await prisma.user.update({ where: { id: member.id }, data: { directoryShowEmail: true } });
    const visible = await getDirectoryPage({ q: member.email, page: "999" });
    expect(visible).toMatchObject({ page: 1, total: 1 });
    expect(visible.members[0]).toMatchObject({ email: member.email, phone: undefined });
    await prisma.user.update({ where: { id: member.id }, data: { directoryShowPhone: true } });
    expect((await getDirectoryPage({ q: "080987654321" })).members[0].phone).toBe("080987654321");
  });
  it("giving filters enforce ownership and exclude expenses and voids", async () => {
    const member = await createUser("MEMBER"); const other = await createUser("MEMBER"); const finance = await createUser("FINANCE");
    for (const data of [
      { memberId: member.id, type: "TITHE" as const, paymentMethod: "CASH" as const, voidedAt: null },
      { memberId: member.id, type: "DONATION" as const, paymentMethod: "BANK_TRANSFER" as const, voidedAt: null },
      { memberId: member.id, type: "EXPENSE" as const, paymentMethod: "CASH" as const, voidedAt: null },
      { memberId: member.id, type: "TITHE" as const, paymentMethod: "CASH" as const, voidedAt: new Date() },
      { memberId: other.id, type: "TITHE" as const, paymentMethod: "CASH" as const, voidedAt: null },
    ]) await prisma.financialTransaction.create({ data: { ...data, amount: 1000, date: new Date("2026-10-08"), recordedById: finance.id } });
    const where = givingWhere(member.id, { from: "2026-10-08", to: "2026-10-08", type: "TITHE", method: "CASH", memberId: other.id });
    expect(await prisma.financialTransaction.count({ where })).toBe(1);
    expect(await prisma.financialTransaction.count({ where: givingWhere(member.id, {}) })).toBe(2);
  });
  it("audit failure rolls a sensitive mutation back", async () => {
    await expect(auditedMutation("missing-actor", "CREATE_DEPARTMENT", "Department", (tx) => tx.department.create({ data: { name: "Rollback", category: "MINISTRY" } }))).rejects.toThrow();
    expect(await prisma.department.count({ where: { name: "Rollback" } })).toBe(0);
    const actor = await createUser("ADMIN");
    const dept = await auditedMutation(actor.id, "CREATE_DEPARTMENT", "Department", (tx) => tx.department.create({ data: { name: "Committed", category: "MINISTRY" } }));
    expect(await prisma.auditLog.count({ where: { entityId: dept.id } })).toBe(1);
  });
  it("overdue database filtering agrees with Lagos calendar-day presentation", async () => {
    const member = await createUser("MEMBER");
    await prisma.pledge.createMany({ data: ["2026-10-07", "2026-10-08", "2026-10-09"].map((endDate) => ({ memberId: member.id, title: endDate, amount: 1000, startDate: new Date("2026-10-01"), endDate: new Date(endDate) })) });
    const now = new Date("2026-10-08T22:59:59Z");
    expect(await prisma.pledge.count({ where: pledgeStatusWhere("OVERDUE", now) })).toBe(1);
    expect(await prisma.pledge.count({ where: pledgeStatusWhere("ACTIVE", now) })).toBe(2);
  });
});
