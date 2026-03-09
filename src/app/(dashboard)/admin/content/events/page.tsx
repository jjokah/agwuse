import type { Metadata } from "next";
import Link from "next/link";
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
import { PlusCircle, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Events Management",
};

export default async function AdminEventsPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const events = await prisma.event.findMany({
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { startDate: "desc" },
  });

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

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar />}
          title="No events yet"
          description="Create your first event."
        />
      ) : (
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
      )}
    </div>
  );
}
