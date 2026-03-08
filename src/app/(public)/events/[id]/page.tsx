import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id, isPublished: true },
  });

  if (!event) return { title: "Event Not Found" };
  return { title: event.title, description: event.description || undefined };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id, isPublished: true },
  });

  if (!event) notFound();

  const isPast = (event.endDate ?? event.startDate) < new Date();

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </Link>

        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">{event.title}</h1>

        {isPast && (
          <div className="mb-4 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Past Event
          </div>
        )}

        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            <span>{formatDate(event.startDate)}</span>
            {event.endDate && event.endDate.toDateString() !== event.startDate.toDateString() && (
              <span>— {formatDate(event.endDate)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span>{formatDateTime(event.startDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p>{event.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
