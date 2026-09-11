import Image from "next/image";
import Link from "next/link";
import type { Event, Sermon } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CHURCH_INFO } from "@/lib/constants";
import { HomeHero } from "@/components/public/home-hero";
import { ServiceTimesStrip } from "@/components/public/service-times-strip";
import { SectionHeading } from "@/components/public/section-heading";
import { EventCard } from "@/components/public/event-card";
import { SermonCard } from "@/components/public/sermon-card";
import { ScriptureQuote } from "@/components/public/scripture-quote";
import { CTABanner } from "@/components/public/cta-banner";

export const revalidate = 60;

const MINISTRY_TILES = [
  {
    title: "Worship & Choir",
    image: "/images/sections/choir.jpg",
    href: "/departments",
  },
  {
    title: "Children's Church",
    image: "/images/sections/children.jpg",
    href: "/departments",
  },
  {
    title: "Weekly Activities",
    image: "/images/gallery/ag-wuse-03.jpg",
    href: "/activities",
  },
];

import { withBuildFallback } from "@/lib/build-fallback";

async function getHomeContent() {
  return withBuildFallback(
    async () => {
      const [events, sermon] = await Promise.all([
        prisma.event.findMany({
          where: { isPublished: true, startDate: { gte: new Date() } },
          orderBy: { startDate: "asc" },
          take: 3,
        }),
        prisma.sermon.findFirst({ orderBy: { date: "desc" } }),
      ]);
      return { events, sermon };
    },
    { events: [], sermon: null },
  );
}

export default async function HomePage() {
  const { events, sermon } = await getHomeContent();

  return (
    <>
      <HomeHero />
      <ServiceTimesStrip />

      {/* Welcome */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[2fr_3fr]">
          <div className="relative mx-auto w-full max-w-md">
            <div
              aria-hidden
              className="absolute -left-4 -top-4 h-full w-full rounded-3xl border-2 border-brand-gold"
            />
            <Image
              src="/images/sections/outreach.jpg"
              alt="Community outreach at AG Wuse"
              width={640}
              height={800}
              className="relative aspect-[4/5] w-full rounded-3xl object-cover shadow-warm"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="Welcome Home"
              title="A family of faith in the heart of Abuja"
            />
            <p className="mt-6 max-w-xl leading-relaxed text-ink-soft">
              {CHURCH_INFO.name} is a vibrant community of believers committed
              to the Word of God, worship, and service. From Sunday worship to
              medical outreaches in our city, we welcome you to join us as we
              grow together in faith.
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep transition-colors hover:text-brand-gold-dark"
            >
              Our story
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      {events.length > 0 && (
        <section className="px-4 pb-20 sm:pb-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="What's Happening" title="Upcoming events" />
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gold-deep transition-colors hover:text-brand-gold-dark"
              >
                All events
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} variant="featured" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest sermon */}
      {sermon && (
        <section className="bg-cream-deep px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="The Word" title="Latest sermon" />
              <Link
                href="/sermons"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gold-deep transition-colors hover:text-brand-gold-dark"
              >
                All sermons
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10">
              <SermonCard sermon={sermon} />
            </div>
          </div>
        </section>
      )}

      {/* Ministries preview */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Find Your Place"
            title="There is room for you here"
            description="Twenty-three departments serve every age and calling, from the choir to children's church to missions and outreach."
            align="center"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {MINISTRY_TILES.map((tile) => (
              <Link
                key={tile.title}
                href={tile.href}
                className="group relative overflow-hidden rounded-3xl shadow-warm"
              >
                <Image
                  src={tile.image}
                  alt={tile.title}
                  width={600}
                  height={750}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/85 via-brand-navy/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6">
                  <h3 className="font-display text-xl font-medium tracking-tight text-white">
                    {tile.title}
                  </h3>
                  <ArrowRight className="size-5 text-brand-gold transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Scripture moment */}
      <section className="pb-20 sm:pb-28">
        <ScriptureQuote
          verse="Behold, how good and how pleasant it is for brethren to dwell together in unity!"
          reference="Psalm 133:1"
        />
      </section>

      <CTABanner
        eyebrow="New Here?"
        title="We would love to meet you"
        description="Become a member, share a prayer request, or simply worship with us this week. The doors are open."
        primary={{ label: "Join Us", href: "/join" }}
        secondary={{ label: "Send a Prayer Request", href: "/prayer-request" }}
      />
    </>
  );
}
