import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { SectionHeading } from "@/components/public/section-heading";
import { EventCard } from "@/components/public/event-card";

export const dynamic = "force-dynamic";

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
