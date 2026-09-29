import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PledgeDetailView } from "@/components/finance/pledge-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pledge = await prisma.pledge.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: pledge ? pledge.title : "Pledge Details",
  };
}

export default async function FinancePledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  const pledge = await prisma.pledge.findUnique({
    where: { id },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      payments: {
        select: {
          id: true,
          date: true,
          receiptNumber: true,
          paymentMethod: true,
          amount: true,
          notes: true,
          voidedAt: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!pledge) notFound();

  return (
    <PledgeDetailView
      pledge={pledge}
      backPath="/finance/pledges"
    />
  );
}
