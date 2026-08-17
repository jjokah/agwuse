"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/public/section-heading";

/** Error boundary for public pages. Most public routes read from the database
 *  (departments, blog, events, gallery), so an unreachable database would
 *  otherwise bubble to the bare root error page and drop the header/footer. */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bg-cream-deep px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-xl text-center">
        <Eyebrow className="mb-4">Something went wrong</Eyebrow>
        <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          This page could not be loaded
        </h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          We hit a problem loading this content. Please try again in a moment. If
          it keeps happening, let us know and we&apos;ll look into it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-navy px-8 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-light"
          >
            Try again
          </button>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-full border border-ink/20 px-8 text-sm font-semibold text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
