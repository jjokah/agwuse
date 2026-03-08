import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageIcon } from "lucide-react";

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
    <div className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Gallery</h1>
          <p className="text-lg text-muted-foreground">
            Moments captured from our church events and activities.
          </p>
        </div>

        {images.length === 0 ? (
          <EmptyState
            icon={<ImageIcon />}
            title="No photos yet"
            description="Photos from church events will be uploaded here soon."
          />
        ) : (
          <div className="space-y-12">
            {[...albums.entries()].map(([albumName, albumImages]) => (
              <section key={albumName}>
                <h2 className="mb-4 text-2xl font-bold">{albumName}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {albumImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg"
                    >
                      <Image
                        src={img.thumbnailUrl || img.url}
                        alt={img.caption || "Gallery image"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {img.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
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
  );
}
