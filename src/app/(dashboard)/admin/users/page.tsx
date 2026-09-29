import type { Metadata } from "next";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
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
import type { UserRole, UserStatus, Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "User Management",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "INACTIVE", label: "Inactive" },
];

const ROLE_OPTIONS = [
  { value: "MEMBER", label: "Member" },
  { value: "DEPT_LEAD", label: "Dept Lead" },
  { value: "FINANCE", label: "Finance" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; role?: string; page?: string; pageSize?: string }>;
}) {
  await requirePageRole(["ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const { q, status, role } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status as UserStatus;
  if (role) where.role = role as UserRole;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    INACTIVE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form className="flex flex-wrap items-center gap-3">
          <Input
            name="q"
            placeholder="Search name or email..."
            defaultValue={q || ""}
            className="w-64"
          />
          <FilterSelect
            name="status"
            placeholder="All Status"
            defaultValue={status || ""}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            name="role"
            placeholder="All Roles"
            defaultValue={role || ""}
            options={ROLE_OPTIONS}
          />
          <FilterSubmit text="Filter" />
        </form>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No users found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium hover:text-brand-gold-dark hover:underline"
                      >
                        {user.firstName} {user.lastName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ||
                          user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[user.status] || ""}`}
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.department?.name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            meta={meta}
            basePath="/admin/users"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
