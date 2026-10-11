import fs from "node:fs";
import path from "node:path";
import { hash } from "bcryptjs";
import { prisma } from "../../src/lib/prisma";
import { resetDatabase } from "../../src/__tests__/integration/helpers";

export default async function setup() {
  await resetDatabase();
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync(path.resolve("test-results/provider-outbox.jsonl"), "");
  const passwordHash = await hash("BrowserPassword123", 12);
  for (const [id, role, firstName, status] of [
    ["browser-member", "MEMBER", "Browser", "ACTIVE"], ["browser-hidden", "MEMBER", "Hidden", "ACTIVE"],
    ["browser-finance", "FINANCE", "Finance", "ACTIVE"], ["browser-admin", "SUPER_ADMIN", "Admin", "ACTIVE"],
    ["browser-inactive", "MEMBER", "Inactive", "INACTIVE"], ["browser-visitor", "VISITOR", "Visitor", "ACTIVE"],
  ] as const) await prisma.user.create({ data: { id, role, firstName, lastName: "Tester", name: `${firstName} Tester`, status, email: `${id}@example.test`, emailVerified: new Date(), passwordHash, phone: id === "browser-hidden" ? "08090001111" : null } });
  await prisma.financialTransaction.createMany({ data: [
    { id: "browser-gift", type: "TITHE", paymentMethod: "CASH", amount: 1000, receiptNumber: "E2E-RECEIPT-1", date: new Date("2026-10-08"), memberId: "browser-member", recordedById: "browser-finance" },
    { id: "browser-other-gift", type: "DONATION", paymentMethod: "BANK_TRANSFER", amount: 2000, receiptNumber: "E2E-RECEIPT-2", date: new Date("2026-10-09"), memberId: "browser-member", recordedById: "browser-finance" },
    { id: "browser-hidden-gift", type: "TITHE", paymentMethod: "CASH", amount: 9999, receiptNumber: "OTHER-MEMBER-RECEIPT", date: new Date("2026-10-08"), memberId: "browser-hidden", recordedById: "browser-finance" },
  ] });
  await prisma.pledge.create({ data: { id: "browser-pledge", title: "Browser pledge", memberId: "browser-member", amount: 10000, startDate: new Date("2026-10-01") } });
  await prisma.$disconnect();
}
