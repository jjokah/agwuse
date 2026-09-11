import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { MediaImage } from "@/components/public/media-image";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import { EventJsonLd } from "@/components/seo/json-ld";

import { getEventById } from "@/lib/data/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.description ? stripHtml(event.description).slice(0, 160) : undefined,
    openGraph: event.imageUrl ? { images: [event.imageUrl] } : undefined,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const isPast = (event.endDate ?? event.startDate) < new Date();

  return (
    <div className="px-4 py-16 sm:py-20">
      <EventJsonLd event={event} />
      <div className="mx-auto max-w-3xl">
        <Link
          href="/events"
          className="mb-10 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-gold-deep"
        >
          <ArrowLeft className="size-4" />
          Back to Events
        </Link>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
          {isPast ? "Past Event" : "Upcoming Event"}
        </p>
        <h1 className="font-display mt-3 text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          {event.title}
        </h1>

        <MediaImage
          src={event.imageUrl}
          alt={event.title}
          aspect="video"
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="mt-10 rounded-3xl shadow-warm"
        />

        <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-paper p-6 shadow-warm sm:flex-row sm:items-center sm:gap-10">
          <div className="flex items-center gap-3">
            <Calendar className="size-5 shrink-0 text-gold-deep" />
            <span className="text-sm text-ink">
              {formatDate(event.startDate)}
              {event.endDate &&
                event.endDate.toDateString() !==
                  event.startDate.toDateString() && (
                  <> to {formatDate(event.endDate)}</>
                )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="size-5 shrink-0 text-gold-deep" />
            <span className="text-sm text-ink">
              {formatDateTime(event.startDate)}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin className="size-5 shrink-0 text-gold-deep" />
              <span className="text-sm text-ink">{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div
            className="prose prose-lg mt-10 max-w-none text-ink"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }}
          />
        )}
      </div>
    </div>
  );
}
