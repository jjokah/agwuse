import type { Metadata } from "next";
import Link from "next/link";
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
import { PlusCircle, Calendar } from "lucide-react";
import type { EventType, Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Events Management",
};

const EVENT_TYPE_OPTIONS = [
  { value: "SERVICE", label: "Service" },
  { value: "REVIVAL", label: "Revival" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "HARVEST", label: "Harvest" },
  { value: "OTHER", label: "Other" },
];

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; page?: string; pageSize?: string }>;
}) {
  await requirePageRole(["ADMIN", "SUPER_ADMIN"]);
  const params = searchParams ? await searchParams : {};
  const { type } = params;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const where: Prisma.EventWhereInput = {};
  if (type) where.type = type as EventType;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { startDate: "desc" },
      skip,
      take,
    }),
    prisma.event.count({ where }),
  ]);

  const meta = pageMeta({ totalItems: total, page, pageSize });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/admin/content/events/new"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          New Event
        </Link>
      </div>

      {/* Filters */}
      <form className="flex items-center gap-3">
        <FilterSelect
          name="type"
          placeholder="All Types"
          defaultValue={type || ""}
          options={EVENT_TYPE_OPTIONS}
        />
        <FilterSubmit text="Filter" />
      </form>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar />}
          title="No events yet"
          description="Create your first event."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="max-w-64 truncate font-medium">
                      {event.title}
                    </TableCell>
                    <TableCell>{formatDate(event.startDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.isPublished ? "default" : "secondary"}>
                        {event.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/content/events/${event.id}`}
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
            basePath="/admin/content/events"
            searchParams={params}
          />
        </div>
      )}
    </div>
  );
}
