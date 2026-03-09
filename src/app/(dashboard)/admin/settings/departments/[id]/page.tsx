import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DepartmentForm } from "../department-form";

export const metadata: Metadata = { title: "Edit Department" };

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  const [department, members] = await Promise.all([
    prisma.department.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  if (!department) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/settings/departments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Departments
      </Link>
      <Card>
        <CardHeader><CardTitle>Edit Department</CardTitle></CardHeader>
        <CardContent>
          <DepartmentForm department={department} members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
