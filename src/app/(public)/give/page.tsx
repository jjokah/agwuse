import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CreditCard, Globe } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";
import { PageHero } from "@/components/public/page-hero";
import { ScriptureQuote } from "@/components/public/scripture-quote";
import { PaystackForm } from "./paystack-form";

export const metadata: Metadata = {
  title: "Give",
  description: `Support the work of God at ${CHURCH_INFO.name} through tithes, offerings, and donations.`,
};

const GIVING_CATEGORIES = [
  "Tithe",
  "General Offering",
  "Special Offering",
  "Mission Offering",
  "Building Fund",
  "Welfare",
  "Special Projects",
];

import { getChurchInfo } from "@/lib/settings";

export default async function GivePage() {
  const churchInfo = await getChurchInfo();

  return (
    <>
      <PageHero eyebrow="Generosity" title="Give" />

      <div className="px-4 py-16 sm:py-20">
        <ScriptureQuote
          verse="Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
          reference="2 Corinthians 9:7"
        />
      </div>

      <div className="px-4 pb-20 sm:pb-24">
        <div className="mx-auto max-w-4xl">
          {/* Bank Transfer centerpiece */}
          <div className="rounded-3xl bg-brand-navy p-10 text-center shadow-warm sm:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">
              Bank Transfer
            </p>
            <p className="mt-6 text-lg text-white/80">{churchInfo.bankName}</p>
            <p className="font-display mt-3 text-5xl font-medium tracking-wide text-brand-gold sm:text-6xl">
              {churchInfo.bankAccount}
            </p>
            <p className="mt-4 text-sm text-white/60">{churchInfo.name}</p>
          </div>

          {/* Other methods */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="flex gap-4 rounded-3xl bg-paper p-6 shadow-warm">
              <Banknote className="mt-1 size-5 shrink-0 text-gold-deep" />
              <div>
                <h3 className="font-medium text-ink">Cash</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Give in person during any of our worship services.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-3xl bg-paper p-6 shadow-warm">
              <CreditCard className="mt-1 size-5 shrink-0 text-gold-deep" />
              <div>
                <h3 className="font-medium text-ink">POS / Card</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  POS machines are available in the church for card payments.
                </p>
              </div>
            </div>
          </div>

          {/* Online payment */}
          <div className="mt-8 rounded-3xl bg-paper p-8 shadow-warm sm:p-10">
            <div className="mb-8 text-center">
              <Globe className="mx-auto mb-3 size-8 text-brand-gold" />
              <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
                Give Online
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Secure payment via Paystack
              </p>
            </div>
            <PaystackForm />
          </div>

          {/* Categories */}
          <div className="mt-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
              Giving Categories
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {GIVING_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-ink/10 bg-paper px-4 py-2 text-sm font-medium text-ink"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Members CTA */}
          <div className="mt-14 rounded-3xl bg-gold-soft p-8 text-center">
            <h3 className="font-display text-2xl font-medium tracking-tight text-ink">
              Church Members
            </h3>
            <p className="mt-2 text-ink-soft">
              Sign in to view your giving history and download receipts.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand-navy px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-light"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
