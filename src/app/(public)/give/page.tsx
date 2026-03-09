import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CreditCard, Landmark, Globe } from "lucide-react";
import { CHURCH_INFO } from "@/lib/constants";
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

export default function GivePage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Give</h1>
          <p className="text-lg text-muted-foreground">
            &quot;Each of you should give what you have decided in your heart to
            give, not reluctantly or under compulsion, for God loves a cheerful
            giver.&quot; — 2 Corinthians 9:7
          </p>
        </div>

        {/* Bank Transfer */}
        <div className="mb-8 rounded-lg border-2 border-brand-gold bg-card p-8 text-center">
          <Landmark className="mx-auto mb-4 size-10 text-brand-gold" />
          <h2 className="mb-2 text-2xl font-bold">Bank Transfer</h2>
          <p className="mb-4 text-muted-foreground">
            Transfer your gift directly to our church account
          </p>
          <div className="space-y-2">
            <p className="text-lg font-semibold">{CHURCH_INFO.bankName}</p>
            <p className="font-mono text-3xl font-bold text-brand-gold-dark">
              {CHURCH_INFO.bankAccount}
            </p>
            <p className="text-sm text-muted-foreground">
              {CHURCH_INFO.name}
            </p>
          </div>
        </div>

        {/* Other Methods */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-4 rounded-lg border bg-card p-6">
            <Banknote className="mt-1 size-5 shrink-0 text-brand-gold" />
            <div>
              <h3 className="font-semibold">Cash</h3>
              <p className="text-sm text-muted-foreground">
                Give in person during any of our worship services.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-lg border bg-card p-6">
            <CreditCard className="mt-1 size-5 shrink-0 text-brand-gold" />
            <div>
              <h3 className="font-semibold">POS / Card</h3>
              <p className="text-sm text-muted-foreground">
                POS machines are available in the church for card payments.
              </p>
            </div>
          </div>
        </div>

        {/* Online Payment */}
        <div className="mb-12 rounded-lg border bg-card p-8">
          <div className="mb-6 text-center">
            <Globe className="mx-auto mb-3 size-8 text-brand-gold" />
            <h2 className="text-2xl font-bold">Give Online</h2>
            <p className="text-sm text-muted-foreground">
              Secure payment via Paystack
            </p>
          </div>
          <PaystackForm />
        </div>

        {/* Giving Categories */}
        <div className="mb-12">
          <h2 className="mb-4 text-center text-2xl font-bold">
            Giving Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {GIVING_CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Members CTA */}
        <div className="rounded-lg bg-muted p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold">Church Members</h3>
          <p className="mb-4 text-muted-foreground">
            Sign in to view your giving history and download receipts.
          </p>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-gold px-6 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-gold-dark"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
