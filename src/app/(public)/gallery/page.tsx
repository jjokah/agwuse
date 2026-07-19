import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageIcon } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { Eyebrow } from "@/components/public/section-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo gallery from AG Wuse Church events and activities.",
};

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ albumName: "asc" }, { sortOrder: "asc" }],
  });

  // Group by album
  const albums = new Map<string, typeof images>();
  for (const img of images) {
    const album = img.albumName || "General";
    if (!albums.has(album)) albums.set(album, []);
    albums.get(album)!.push(img);
  }

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
                        <Image
                          src={img.thumbnailUrl || img.url}
                          alt={img.caption || "Gallery image"}
                          width={600}
                          height={450}
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}
