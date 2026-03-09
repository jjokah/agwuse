import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Departments",
};

export default async function DepartmentsSettingsPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const departments = await prisma.department.findMany({
    include: { leader: { select: { firstName: true, lastName: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Settings
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Departments</h1>
        <Link
          href="/admin/settings/departments/new"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          Add Department
        </Link>
      </div>

      {departments.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No departments"
          description="Add your first department."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dept.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {dept.leader
                      ? `${dept.leader.firstName} ${dept.leader.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={dept.isActive ? "default" : "secondary"}>
                      {dept.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/settings/departments/${dept.id}`}
                      className="text-sm text-brand-gold-dark hover:underline"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
