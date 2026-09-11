import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import { ScrollText } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Audit Log",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string; page?: string; pageSize?: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const { q, entity } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.AuditLogWhereInput = {};
  if (entity) where.entity = entity;
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { user: { firstName: { contains: q, mode: "insensitive" } } },
      { user: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [logs, total, entityGroups] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["entity"],
      orderBy: { entity: "asc" },
    }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });
  const entityOptions = entityGroups.map((g) => ({
    value: g.entity,
    label: g.entity,
  }));

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

      <form className="flex flex-wrap items-center gap-3">
        <Input
          name="q"
          placeholder="Search actions or users..."
          defaultValue={q || ""}
          className="w-56"
        />
        <FilterSelect
          name="entity"
          placeholder="All Entities"
          defaultValue={entity || ""}
          options={entityOptions}
        />
        <FilterSubmit text="Filter" />
      </form>

      {logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText />}
          title="No audit logs"
          description="System activity will appear here."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead className="max-w-64">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      {log.user
                        ? `${log.user.firstName} ${log.user.lastName}`
                        : "System"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.entityId ? log.entityId.slice(0, 8) + "..." : "—"}
                    </TableCell>
                    <TableCell className="max-w-64 truncate font-mono text-xs text-muted-foreground">
                      {log.details || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            meta={meta}
            basePath="/admin/settings/audit-log"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
