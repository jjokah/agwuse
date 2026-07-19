import { cn } from "@/lib/utils";

interface ScriptureQuoteProps {
  verse: string;
  reference: string;
  className?: string;
}

/** Large serif pull-quote used as a breathing moment between sections. */
export function ScriptureQuote({
  verse,
  reference,
  className,
}: ScriptureQuoteProps) {
  return (
    <figure className={cn("mx-auto max-w-3xl px-4 text-center", className)}>
      <span
        aria-hidden
        className="font-display block text-7xl leading-none text-brand-gold"
      >
        &ldquo;
      </span>
      <blockquote className="font-display -mt-4 text-2xl font-medium italic leading-snug tracking-tight text-ink sm:text-3xl">
        {verse}
      </blockquote>
      <figcaption className="mt-6 flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-brand-gold" />
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
          {reference}
        </span>
        <span className="h-px w-8 bg-brand-gold" />
      </figcaption>
    </figure>
  );
}
