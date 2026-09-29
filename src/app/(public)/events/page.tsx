import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { SectionHeading } from "@/components/public/section-heading";
import { EventCard } from "@/components/public/event-card";

import { withBuildFallback } from "@/lib/build-fallback";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming events and programs at AG Wuse Church.",
};

async function getEventsData() {
  const now = new Date();
  return withBuildFallback(
    async () => {
      const [events, pastEvents] = await Promise.all([
        prisma.event.findMany({
          where: {
            isPublished: true,
            OR: [
              { endDate: { gte: now } },
              { endDate: null, startDate: { gte: now } },
            ],
          },
          orderBy: { startDate: "asc" },
          take: 20,
        }),
        prisma.event.findMany({
          where: {
            isPublished: true,
            OR: [
              { endDate: { lt: now } },
              { endDate: null, startDate: { lt: now } },
            ],
          },
          orderBy: { startDate: "desc" },
          take: 6,
        }),
      ]);
      return { events, pastEvents };
    },
    { events: [], pastEvents: [] },
  );
}

export default async function EventsPage() {
  const { events, pastEvents } = await getEventsData();

  return (
    <>
      <PageHero
        eyebrow="What's Happening"
        title="Events"
        description="Upcoming events, programs, and special services."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          {events.length === 0 ? (
            <EmptyState
              icon={<Calendar />}
              title="No upcoming events"
              description="There are no upcoming events at this time. Check back soon."
            />
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} variant="row" />
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <section className="mt-20">
              <SectionHeading eyebrow="Looking Back" title="Past events" />
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="past" />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
