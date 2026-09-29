import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
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
import { MessageSquare } from "lucide-react";
import { ModerationActions } from "./moderation-actions";
import type { SubmissionStatus, SubmissionType, Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Moderation Queue",
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ARCHIVED", label: "Archived" },
];

const TYPE_OPTIONS = [
  { value: "PRAYER_REQUEST", label: "Prayer Requests" },
  { value: "TESTIMONY", label: "Testimonies" },
];

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string; pageSize?: string }>;
}) {
  await requirePageRole(["ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const { status, type } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.SubmissionWhereInput = {};
  if (status) where.status = status as SubmissionStatus;
  else if (status === undefined) where.status = "PENDING";

  if (type) where.type = type as SubmissionType;

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        submittedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.submission.count({ where }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderation Queue</h1>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3">
        <FilterSelect
          name="status"
          placeholder="All Status"
          defaultValue={status ?? "PENDING"}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          name="type"
          placeholder="All Types"
          defaultValue={type || ""}
          options={TYPE_OPTIONS}
        />
        <FilterSubmit text="Filter" />
      </form>

      {submissions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="No submissions"
          description="No items matching your filters."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead className="max-w-64">Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {sub.type === "PRAYER_REQUEST" ? "Prayer" : "Testimony"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.submittedBy
                        ? `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}`
                        : sub.name || "Anonymous"}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-sm">
                      {sub.content.slice(0, 100)}
                      {sub.content.length > 100 ? "..." : ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.status === "APPROVED"
                            ? "default"
                            : sub.status === "ARCHIVED"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {sub.status}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sub.isPublic
                          ? "Public if approved"
                          : "Private (never published)"}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(sub.createdAt)}</TableCell>
                    <TableCell>
                      <ModerationActions
                        id={sub.id}
                        status={sub.status}
                        isPublic={sub.isPublic}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            meta={meta}
            basePath="/admin/content/moderation"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
