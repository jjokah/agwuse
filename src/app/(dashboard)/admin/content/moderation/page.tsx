import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
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
import { MessageSquare } from "lucide-react";
import { ModerationActions } from "./moderation-actions";

export const metadata: Metadata = {
  title: "Moderation Queue",
};

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { status, type } = await searchParams;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  else where.status = "PENDING";
  if (type) where.type = type;

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      submittedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderation Queue</h1>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status || "PENDING"}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="ARCHIVED">Archived</option>
          <option value="">All</option>
        </select>
        <select
          name="type"
          defaultValue={type || ""}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All Types</option>
          <option value="PRAYER_REQUEST">Prayer Requests</option>
          <option value="TESTIMONY">Testimonies</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Filter
        </button>
      </form>

      {submissions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="No submissions"
          description="No items matching your filters."
        />
      ) : (
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
                  </TableCell>
                  <TableCell>{formatDate(sub.createdAt)}</TableCell>
                  <TableCell>
                    <ModerationActions
                      id={sub.id}
                      status={sub.status}
                    />
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
