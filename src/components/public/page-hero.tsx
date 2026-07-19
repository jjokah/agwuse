import { cn } from "@/lib/utils";
import { Eyebrow } from "./section-heading";
import { MediaImage } from "./media-image";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: { src: string; alt: string };
  align?: "center" | "left";
}

/** Interior-page opener: cream band with eyebrow + serif title,
 *  optionally split with a rounded photo on the right. */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  align = "center",
}: PageHeroProps) {
  const text = (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && !image && "mx-auto text-center"
      )}
    >
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      {description && (
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          {description}
        </p>
      )}
    </div>
  );

  return (
    <section className="border-b border-border bg-cream-deep px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {image ? (
          <div className="grid items-center gap-10 lg:grid-cols-[3fr_2fr]">
            {text}
            <MediaImage
              src={image.src}
              alt={image.alt}
              aspect="video"
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="rounded-3xl shadow-warm"
            />
          </div>
        ) : (
          text
        )}
      </div>
    </section>
  );
}
