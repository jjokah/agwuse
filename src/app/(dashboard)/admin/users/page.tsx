import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
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
  title: "User Management",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; role?: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { q, status, role } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (role) where.role = role;

  const users = await prisma.user.findMany({
    where,
    include: { department: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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
        <form className="flex gap-3">
          <Input
            name="q"
            placeholder="Search name or email..."
            defaultValue={q || ""}
            className="w-64"
          />
          <select
            name="status"
            defaultValue={status || ""}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            name="role"
            defaultValue={role || ""}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Roles</option>
            <option value="MEMBER">Member</option>
            <option value="DEPT_LEAD">Dept Lead</option>
            <option value="FINANCE">Finance</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Filter
          </button>
        </form>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No users found"
          description="Try adjusting your search or filters."
        />
      ) : (
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
      )}
    </div>
  );
}
