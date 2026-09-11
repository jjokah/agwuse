import Link from "next/link";

export default function NotFound() {
  return (
    <div data-surface="public" className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">
        Error 404
      </p>
      <h1 className="font-display mt-4 text-5xl font-medium tracking-tight text-ink sm:text-6xl">
        This page has wandered off
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
        have been moved or doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-gold px-8 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-dark"
      >
        Go Home
      </Link>
    </div>
  );
}
