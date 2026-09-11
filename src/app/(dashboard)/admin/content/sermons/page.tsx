import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { parsePageParams, pageMeta } from "@/lib/pagination";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Input } from "@/components/ui/input";
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
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Sermons Management",
};

export default async function AdminSermonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const params = searchParams ? await searchParams : {};
  const { q } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.SermonWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { speaker: { contains: q, mode: "insensitive" } },
      { seriesName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [sermons, total] = await Promise.all([
    prisma.sermon.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take,
    }),
    prisma.sermon.count({ where }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

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

      <form className="flex items-center gap-3">
        <Input
          name="q"
          placeholder="Search sermons..."
          defaultValue={q || ""}
          className="max-w-sm"
        />
      </form>

      {sermons.length === 0 ? (
        <EmptyState
          icon={<Mic />}
          title="No sermons yet"
          description="Add your first sermon."
        />
      ) : (
        <div className="space-y-4">
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

          <PaginationBar
            meta={meta}
            basePath="/admin/content/sermons"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
