import Link from "next/link";
import type { Event } from "@prisma/client";
import { MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CHURCH_TIME_ZONE, lagosDateParts } from "@/lib/tz";
import { MediaImage } from "./media-image";

interface EventCardProps {
  event: Event;
  variant?: "featured" | "row" | "past";
}

function DateBlock({ date }: { date: Date }) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center rounded-2xl bg-gold-soft py-3 text-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
        {date.toLocaleDateString("en-NG", { month: "short", timeZone: CHURCH_TIME_ZONE })}
      </span>
      <span className="font-display text-3xl font-medium leading-none text-ink">
        {lagosDateParts(date).day}
      </span>
    </div>
  );
}

export function EventCard({ event, variant = "row" }: EventCardProps) {
  if (variant === "past") {
    return (
      <Link
        href={`/events/${event.id}`}
        className="group rounded-2xl bg-paper p-5 transition-all hover:-translate-y-0.5 hover:shadow-warm"
      >
        <h3 className="font-medium text-ink group-hover:text-gold-deep">
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">{formatDate(event.startDate)}</p>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link
        href={`/events/${event.id}`}
        className="group flex flex-col overflow-hidden rounded-3xl bg-paper shadow-warm transition-all hover:-translate-y-1"
      >
        <MediaImage
          src={event.imageUrl}
          alt={event.title}
          aspect="video"
          sizes="(max-width: 768px) 100vw, 33vw"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="flex flex-1 gap-4 p-6">
          <DateBlock date={event.startDate} />
          <div>
            <h3 className="font-display text-xl font-medium tracking-tight text-ink group-hover:text-gold-deep">
              {event.title}
            </h3>
            {event.location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
                <MapPin className="size-3.5 shrink-0 text-gold-deep" />
                {event.location}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col gap-5 rounded-3xl bg-paper p-6 transition-all hover:-translate-y-0.5 hover:shadow-warm sm:flex-row"
    >
      <DateBlock date={event.startDate} />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-xl font-medium tracking-tight text-ink group-hover:text-gold-deep">
          {event.title}
        </h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
          <span>{formatDate(event.startDate)}</span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-gold-deep" />
              {event.location}
            </span>
          )}
        </div>
        {event.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {event.description}
          </p>
        )}
      </div>
      {event.imageUrl && (
        <MediaImage
          src={event.imageUrl}
          alt=""
          aspect="video"
          sizes="200px"
          className="w-full shrink-0 rounded-2xl sm:w-44"
        />
      )}
    </Link>
  );
}
