import { cn } from "@/lib/utils";
import { getChurchInfo } from "@/lib/settings";
import { parseServiceTime } from "@/lib/settings/schema";

interface ServiceTimesStripProps {
  variant?: "band" | "inline";
}

/** Weekly service times (from church settings) as a refined columned strip. */
export async function ServiceTimesStrip({ variant = "band" }: ServiceTimesStripProps) {
  const isBand = variant === "band";
  const { serviceTimes } = await getChurchInfo();
  const items = serviceTimes.map(parseServiceTime);
  return (
    <section
      className={cn(
        isBand ? "bg-brand-navy px-4 py-10" : "rounded-3xl bg-cream-deep p-8"
      )}
    >
      <div
        className={cn(
          "grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5",
          isBand && "mx-auto max-w-7xl"
        )}
      >
        {items.map((item, index) => (
          <div
            key={`${index}-${item.day}-${item.activity}`}
            className={cn(
              "border-l pl-4",
              isBand ? "border-white/15" : "border-border"
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.2em]",
                isBand ? "text-brand-gold" : "text-gold-deep"
              )}
            >
              {item.day}
            </p>
            <p
              className={cn(
                "mt-1.5 text-sm font-medium leading-snug",
                isBand ? "text-white" : "text-ink"
              )}
            >
              {item.activity}
            </p>
            <p
              className={cn(
                "mt-1 text-sm",
                isBand ? "text-brand-gold-light" : "text-ink-soft"
              )}
            >
              {item.time}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
