import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { parsePageParams, pageMeta } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { FilterSelect, FilterSubmit } from "@/components/shared/filter-select";
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
import { DeleteDepartmentButton } from "./delete-department-button";
import type { DepartmentCategory, Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Departments",
};

const CATEGORY_OPTIONS = [
  { value: "MINISTRY", label: "Ministry" },
  { value: "COMMITTEE", label: "Committee" },
  { value: "CHOIR", label: "Choir" },
  { value: "OUTREACH", label: "Outreach" },
];

export default async function DepartmentsSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; page?: string; pageSize?: string }>;
}) {
  await requirePageRole(["ADMIN", "SUPER_ADMIN"]);
  const params = searchParams ? await searchParams : {};
  const { category } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.DepartmentWhereInput = {};
  if (category) where.category = category as DepartmentCategory;

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      include: {
        leader: { select: { firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip,
      take,
    }),
    prisma.department.count({ where }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

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

      {/* Filters */}
      <form className="flex items-center gap-3">
        <FilterSelect
          name="category"
          placeholder="All Categories"
          defaultValue={category || ""}
          options={CATEGORY_OPTIONS}
        />
        <FilterSubmit text="Filter" />
      </form>

      {departments.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No departments"
          description="Add your first department."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
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
                    <TableCell>{dept._count.members}</TableCell>
                    <TableCell>
                      <Badge variant={dept.isActive ? "default" : "secondary"}>
                        {dept.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/settings/departments/${dept.id}`}
                          className="text-sm text-brand-gold-dark hover:underline font-medium"
                        >
                          Edit
                        </Link>
                        <DeleteDepartmentButton
                          id={dept.id}
                          name={dept.name}
                          memberCount={dept._count.members}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            meta={meta}
            basePath="/admin/settings/departments"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
