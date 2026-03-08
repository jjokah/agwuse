import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming events and programs at AG Wuse Church.",
};

export default async function EventsPage() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      OR: [
        { endDate: { gte: now } },
        { endDate: null, startDate: { gte: now } },
      ],
    },
    orderBy: { startDate: "asc" },
    take: 20,
  });

  const pastEvents = await prisma.event.findMany({
    where: {
      isPublished: true,
      OR: [
        { endDate: { lt: now } },
        { endDate: null, startDate: { lt: now } },
      ],
    },
    orderBy: { startDate: "desc" },
    take: 6,
  });

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Events</h1>
          <p className="text-lg text-muted-foreground">
            Upcoming events, programs, and special services.
          </p>
        </div>

        {/* Upcoming Events */}
        {events.length === 0 ? (
          <EmptyState
            icon={<Calendar />}
            title="No upcoming events"
            description="There are no upcoming events at this time. Check back soon."
          />
        ) : (
          <div className="mb-16 space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex gap-4 rounded-lg border bg-card p-6 transition-colors hover:border-brand-gold"
              >
                <div className="flex shrink-0 flex-col items-center rounded-lg bg-brand-gold/10 px-3 py-2 text-center">
                  <span className="text-xs font-bold uppercase text-brand-gold-dark">
                    {event.startDate.toLocaleDateString("en-NG", {
                      month: "short",
                    })}
                  </span>
                  <span className="text-2xl font-bold text-brand-gold-dark">
                    {event.startDate.getDate()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold group-hover:text-brand-gold-dark">
                    {event.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(event.startDate)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-muted-foreground">
              Past Events
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="rounded-lg border bg-card p-4 opacity-75 transition-opacity hover:opacity-100"
                >
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.startDate)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
