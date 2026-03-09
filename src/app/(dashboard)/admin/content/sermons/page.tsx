import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { PlusCircle, Mic } from "lucide-react";

export const metadata: Metadata = {
  title: "Sermons Management",
};

export default async function AdminSermonsPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const sermons = await prisma.sermon.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Sermons</h1>
        <Link
          href="/admin/content/sermons/new"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          Add Sermon
        </Link>
      </div>

      {sermons.length === 0 ? (
        <EmptyState
          icon={<Mic />}
          title="No sermons yet"
          description="Add your first sermon."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Speaker</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sermons.map((sermon) => (
                <TableRow key={sermon.id}>
                  <TableCell className="max-w-48 truncate font-medium">
                    {sermon.title}
                  </TableCell>
                  <TableCell>{sermon.speaker}</TableCell>
                  <TableCell>{formatDate(sermon.date)}</TableCell>
                  <TableCell>{sermon.seriesName || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[sermon.audioUrl && "Audio", sermon.videoUrl && "Video"]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/content/sermons/${sermon.id}`}
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
