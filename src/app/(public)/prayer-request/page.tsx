import type { Metadata } from "next";
import Image from "next/image";
import { SubmissionForm } from "@/components/forms/submission-form";
import { submitPrayerRequest } from "@/lib/actions/submission-actions";
import { PageHero } from "@/components/public/page-hero";
import { ScriptureQuote } from "@/components/public/scripture-quote";

export const metadata: Metadata = {
  title: "Prayer Request",
  description:
    "Submit your prayer request. Our prayer team is ready to stand with you in prayer.",
};

export default function PrayerRequestPage() {
  return (
    <>
      <PageHero eyebrow="We Stand With You" title="Prayer Request" />

      <div className="relative">
        <Image
          src="/images/sections/prayer-strip.jpg"
          alt="The congregation of AG Wuse in prayer"
          width={1270}
          height={300}
          sizes="100vw"
          className="h-40 w-full object-cover sm:h-56"
        />
        <div className="absolute inset-0 bg-brand-navy/40" />
      </div>

      <div className="px-4 py-16 sm:py-20">
        <ScriptureQuote
          verse="The prayer of a righteous person is powerful and effective."
          reference="James 5:16"
        />
      </div>

      <div className="px-4 pb-20 sm:pb-24">
        <div className="mx-auto max-w-2xl rounded-3xl bg-paper p-8 shadow-warm sm:p-10">
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
            Share Your Prayer Need
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Your prayer request will be shared with our prayer team. You can
            choose whether to make it public.
          </p>
          <div className="mt-8">
            <SubmissionForm type="prayer-request" onSubmit={submitPrayerRequest} />
          </div>
        </div>
      </div>
    </>
  );
}
