import type { Sermon } from "@prisma/client";
import { Headphones, Video } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MediaImage } from "./media-image";

/** Horizontal editorial row: thumbnail, series eyebrow, serif title, media pills. */
export function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <article className="flex flex-col gap-6 rounded-3xl bg-paper p-6 shadow-warm sm:flex-row sm:items-center">
      <MediaImage
        src={sermon.thumbnailUrl}
        alt={sermon.title}
        aspect="video"
        sizes="(max-width: 640px) 100vw, 240px"
        className="w-full shrink-0 rounded-2xl sm:w-60"
      />
      <div className="min-w-0 flex-1">
        {sermon.seriesName && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
            {sermon.seriesName}
          </p>
        )}
        <h2 className="font-display mt-1 text-2xl font-medium tracking-tight text-ink">
          {sermon.title}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {sermon.speaker} &middot; {formatDate(sermon.date)}
        </p>
        {sermon.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {sermon.description}
          </p>
        )}
        <div className="mt-4 flex gap-3">
          {sermon.audioUrl && (
            <a
              href={sermon.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-medium text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
            >
              <Headphones className="size-4" />
              Listen
            </a>
          )}
          {sermon.videoUrl && (
            <a
              href={sermon.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-medium text-ink transition-colors hover:border-gold-deep hover:text-gold-deep"
            >
              <Video className="size-4" />
              Watch
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
