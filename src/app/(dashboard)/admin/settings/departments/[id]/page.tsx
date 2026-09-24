import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DepartmentForm } from "../department-form";
import { DepartmentRoster } from "./department-roster";

export const metadata: Metadata = { title: "Edit Department" };

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      leader: { select: { firstName: true, lastName: true } },
      members: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      },
    },
  });

  if (!department) notFound();

  const leaderName = department.leader
    ? `${department.leader.firstName} ${department.leader.lastName}`
    : undefined;

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
        <CardHeader>
          <CardTitle>Edit Department</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentForm department={department} leaderName={leaderName} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Roster</CardTitle>
          <CardDescription>
            Manage members assigned to this department ({department.members.length} members).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentRoster departmentId={department.id} members={department.members} />
        </CardContent>
      </Card>
    </div>
  );
}
