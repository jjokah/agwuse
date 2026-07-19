import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { WEEKLY_ACTIVITIES, CHURCH_INFO } from "@/lib/constants";
import { PageHero } from "@/components/public/page-hero";

export const metadata: Metadata = {
  title: "Weekly Activities",
  description: `Weekly programs and activities at ${CHURCH_INFO.name}.`,
};

export default function ActivitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Rhythm"
        title="Weekly Activities"
        description="Join us throughout the week for worship, study, and fellowship."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="divide-y divide-border">
            {WEEKLY_ACTIVITIES.map((activity) => (
              <div
                key={activity.day}
                className="flex items-center gap-6 py-6 sm:gap-8"
              >
                <span className="font-display w-20 shrink-0 text-3xl font-medium tracking-tight text-brand-gold sm:text-4xl">
                  {activity.day.slice(0, 3)}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium text-ink">{activity.activity}</h3>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    Every {activity.day}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gold-deep">
                  <Clock className="size-4" />
                  {activity.time}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/contact"
            className="mt-12 flex items-center justify-center gap-3 rounded-3xl bg-gold-soft p-6 text-center transition-colors hover:bg-brand-gold/30"
          >
            <MapPin className="size-5 shrink-0 text-gold-deep" />
            <p className="text-ink-soft">
              All activities hold at the church premises:{" "}
              <span className="font-medium text-ink">{CHURCH_INFO.address}</span>
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
