import Image from "next/image";
import { cn } from "@/lib/utils";

interface PersonCardProps {
  name: string;
  role: string;
  bio?: string;
  image?: string | null;
  size?: "lg" | "sm";
}

function initials(name: string) {
  return name
    .replace(/^(Rev\.|Elder|Pastor|Dr\.)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Ministers and board members. Renders the real headshot when one exists,
 *  otherwise a serif monogram (never a placeholder face for a named person). */
export function PersonCard({ name, role, bio, image, size = "sm" }: PersonCardProps) {
  const lg = size === "lg";
  const avatarSize = lg ? 112 : 96;

  const avatar = image ? (
    <Image
      src={image}
      alt={name}
      width={avatarSize}
      height={avatarSize}
      className={cn(
        "shrink-0 rounded-full object-cover ring-2 ring-brand-gold/40 ring-offset-4 ring-offset-background",
        lg ? "size-28" : "size-24"
      )}
    />
  ) : (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gold-soft ring-2 ring-brand-gold/40 ring-offset-4 ring-offset-background",
        lg ? "size-28" : "size-24"
      )}
    >
      <span
        className={cn(
          "font-display font-medium text-gold-deep",
          lg ? "text-3xl" : "text-2xl"
        )}
      >
        {initials(name)}
      </span>
    </div>
  );

  if (lg) {
    return (
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
        {avatar}
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
            {name}
          </h2>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
            {role}
          </p>
          {bio && <p className="mt-4 leading-relaxed text-ink-soft">{bio}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-3xl bg-paper p-8 text-center shadow-warm">
      {avatar}
      <h3 className="font-display mt-5 text-xl font-medium tracking-tight text-ink">
        {name}
      </h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
        {role}
      </p>
      {bio && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{bio}</p>
      )}
    </div>
  );
}
