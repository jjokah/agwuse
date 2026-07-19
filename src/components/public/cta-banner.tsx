import Link from "next/link";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./section-heading";

interface CTALink {
  label: string;
  href: string;
}

interface CTABannerProps {
  eyebrow?: string;
  title: string;
  description?: string;
  primary: CTALink;
  secondary?: CTALink;
  variant?: "navy" | "gold";
}

/** Full-bleed closing band with pill CTAs. */
export function CTABanner({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  variant = "navy",
}: CTABannerProps) {
  const navy = variant === "navy";
  return (
    <section
      className={cn("px-4 py-20 sm:py-24", navy ? "bg-brand-navy" : "bg-gold-soft")}
    >
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow && (
          <Eyebrow className={cn("mb-4", navy && "text-brand-gold")}>
            {eyebrow}
          </Eyebrow>
        )}
        <h2
          className={cn(
            "font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl",
            navy ? "text-white" : "text-ink"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mx-auto mt-4 max-w-xl text-lg leading-relaxed",
              navy ? "text-white/70" : "text-ink-soft"
            )}
          >
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={primary.href}
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-semibold transition-colors",
              navy
                ? "bg-brand-gold text-brand-navy hover:bg-brand-gold-light"
                : "bg-brand-navy text-white hover:bg-brand-navy-light"
            )}
          >
            {primary.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className={cn(
                "inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-semibold transition-colors",
                navy
                  ? "border-white/30 text-white hover:border-brand-gold hover:text-brand-gold"
                  : "border-ink/20 text-ink hover:border-gold-deep hover:text-gold-deep"
              )}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
