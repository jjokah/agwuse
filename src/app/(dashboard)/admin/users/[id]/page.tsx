import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { UserActions } from "./user-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });
  return {
    title: user ? `${user.firstName} ${user.lastName}` : "User Not Found",
  };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { department: { select: { name: true } } },
  });

  if (!user) notFound();

  // Get user's giving history
  const transactions = await prisma.financialTransaction.findMany({
    where: { memberId: id, type: { not: "EXPENSE" } },
    orderBy: { date: "desc" },
    take: 10,
  });

  const givingTotal = await prisma.financialTransaction.aggregate({
    where: { memberId: id, type: { not: "EXPENSE" } },
    _sum: { amount: true },
  });

  const totalGiving = givingTotal._sum.amount
    ? Number(givingTotal._sum.amount)
    : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">
              {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
            </Badge>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                user.status === "ACTIVE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : user.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {user.status}
            </span>
          </div>
        </div>

        <UserActions userId={user.id} currentRole={user.role} currentStatus={user.status} />
      </div>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd className="font-medium">{user.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Gender</dt>
              <dd className="font-medium">{user.gender || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Marital Status</dt>
              <dd className="font-medium">{user.maritalStatus || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Date of Birth</dt>
              <dd className="font-medium">
                {user.dateOfBirth ? formatDate(user.dateOfBirth) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Occupation</dt>
              <dd className="font-medium">{user.occupation || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Department</dt>
              <dd className="font-medium">{user.department?.name || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Address</dt>
              <dd className="font-medium">{user.address || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Member Since</dt>
              <dd className="font-medium">
                {user.memberSince ? formatDate(user.memberSince) : formatDate(user.createdAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Giving History */}
      <Card>
        <CardHeader>
          <CardTitle>
            Giving History (Total: {formatCurrency(totalGiving)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No giving records.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{tx.type.replace("_", " ")}</span>
                    <span className="ml-2 text-muted-foreground">
                      {formatDate(tx.date)}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
