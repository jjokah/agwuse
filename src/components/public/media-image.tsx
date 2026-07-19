import Image from "next/image";
import { cn } from "@/lib/utils";

const ASPECTS = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  wide: "aspect-[16/7]",
} as const;

interface MediaImageProps {
  src: string | null | undefined;
  alt: string;
  aspect?: keyof typeof ASPECTS;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * The single mechanism for rendering DB-driven image URLs
 * (event.imageUrl, sermon.thumbnailUrl, blogPost.featuredImage).
 * Falls back to a navy-to-gold gradient panel with a faint logo
 * watermark when no image is available.
 */
export function MediaImage({
  src,
  alt,
  aspect = "video",
  sizes,
  priority,
  className,
  imgClassName,
}: MediaImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        ASPECTS[aspect],
        !src &&
          "bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-gold-dark",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/ag-logo.png"
            alt=""
            width={96}
            height={96}
            className="opacity-25"
          />
        </div>
      )}
    </div>
  );
}
