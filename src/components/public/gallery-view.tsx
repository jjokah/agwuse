import Link from "next/link";
import { MediaImage } from "@/components/public/media-image";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { Eyebrow } from "@/components/public/section-heading";
import { pageMeta } from "@/lib/pagination";
import type { GalleryImage } from "@prisma/client";

export interface GalleryViewProps {
  images: GalleryImage[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export function GalleryView({
  images,
  total,
  currentPage,
  pageSize,
}: GalleryViewProps) {
  const meta = pageMeta({ totalItems: total, page: currentPage, pageSize });

  // Group by album
  const albums = new Map<string, GalleryImage[]>();
  for (const img of images) {
    const album = img.albumName || "General";
    if (!albums.has(album)) albums.set(album, []);
    albums.get(album)!.push(img);
  }

  const prevHref = meta.hasPrevPage
    ? meta.currentPage - 1 === 1
      ? "/gallery"
      : `/gallery/page/${meta.currentPage - 1}`
    : null;

  const nextHref = meta.hasNextPage
    ? `/gallery/page/${meta.currentPage + 1}`
    : null;

  return (
    <>
      <PageHero
        eyebrow="Moments"
        title="Gallery"
        description="Moments captured from our church events and activities."
      />
      <div className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          {images.length === 0 ? (
            <EmptyState
              icon={<ImageIcon />}
              title="No photos yet"
              description="Photos from church events will be uploaded here soon."
            />
          ) : (
            <div className="space-y-16">
              {[...albums.entries()].map(([albumName, albumImages]) => (
                <section key={albumName}>
                  <div className="mb-6 flex items-center gap-6">
                    <div>
                      <Eyebrow className="mb-1">Album</Eyebrow>
                      <h2 className="font-display whitespace-nowrap text-3xl font-medium tracking-tight text-ink">
                        {albumName}
                      </h2>
                    </div>
                    <div className="mt-6 h-px flex-1 bg-border" />
                  </div>
                  <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
                    {albumImages.map((img) => (
                      <div
                        key={img.id}
                        className="group relative break-inside-avoid overflow-hidden rounded-2xl shadow-warm"
                      >
                        <MediaImage
                          src={img.thumbnailUrl || img.url}
                          alt={img.caption || "Gallery image"}
                          aspect="video"
                          className="w-full transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {img.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/70 to-transparent p-3">
                            <p className="text-xs text-white">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* Gallery ISR Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div>
                    {prevHref ? (
                      <Link
                        href={prevHref}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50">
                        <ChevronLeft className="size-4" />
                        Previous
                      </span>
                    )}
                  </div>

                  <span className="text-sm text-muted-foreground">
                    Page {meta.currentPage} of {meta.totalPages}
                  </span>

                  <div>
                    {nextHref ? (
                      <Link
                        href={nextHref}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50">
                        Next
                        <ChevronRight className="size-4" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
