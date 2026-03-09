import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import { ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "Audit Log",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { q, entity } = await searchParams;

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { user: { firstName: { contains: q, mode: "insensitive" } } },
      { user: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const entities = await prisma.auditLog.findMany({
    select: { entity: true },
    distinct: ["entity"],
    orderBy: { entity: "asc" },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Settings
      </Link>

      <h1 className="text-2xl font-bold">Audit Log</h1>

      <form className="flex flex-wrap gap-3">
        <Input
          name="q"
          placeholder="Search actions or users..."
          defaultValue={q || ""}
          className="w-56"
        />
        <select
          name="entity"
          defaultValue={entity || ""}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All Entities</option>
          {entities.map((e) => (
            <option key={e.entity} value={e.entity}>
              {e.entity}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filter
        </button>
      </form>

      {logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText />}
          title="No audit logs"
          description="System activity will appear here."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.user.firstName} {log.user.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.entity}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                    {log.details || "—"}
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
