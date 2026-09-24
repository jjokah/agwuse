import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { toLagosDateString } from "@/lib/tz";
import { MediaImage } from "@/components/public/media-image";
import { stripHtml } from "@/lib/sanitize";
import { EventJsonLd } from "@/components/seo/json-ld";

import { getEventById } from "@/lib/data/content";
import { getChurchInfo } from "@/lib/settings";

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
  const [event, churchInfo] = await Promise.all([getEventById(id), getChurchInfo()]);

  if (!event) notFound();

  const isPast = (event.endDate ?? event.startDate) < new Date();

  return (
    <div className="px-4 py-16 sm:py-20">
      <EventJsonLd event={event} address={churchInfo.address} />
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
                toLagosDateString(event.endDate) !==
                  toLagosDateString(event.startDate) && (
                  <> to {formatDate(event.endDate)}</>
                )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="size-5 shrink-0 text-gold-deep" />
            <span className="text-sm text-ink">
              {formatTime(event.startDate)}
              {event.endDate && <> &ndash; {formatTime(event.endDate)}</>}
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
          // Plain text from a textarea: keep the organizer's line breaks
          <p className="mt-10 whitespace-pre-line text-lg leading-relaxed text-ink">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
