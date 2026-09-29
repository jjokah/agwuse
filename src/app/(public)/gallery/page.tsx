import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { withBuildFallback } from "@/lib/build-fallback";
import { GalleryView } from "@/components/public/gallery-view";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo gallery from AG Wuse Church events and activities.",
};

const PAGE_SIZE = 24;

export default async function GalleryPage() {
  const [images, total] = await withBuildFallback(
    () =>
      Promise.all([
        prisma.galleryImage.findMany({
          orderBy: [{ albumName: "asc" }, { sortOrder: "asc" }],
          take: PAGE_SIZE,
          skip: 0,
        }),
        prisma.galleryImage.count(),
      ]),
    [[], 0],
  );

  return (
    <GalleryView
      images={images}
      total={total}
      currentPage={1}
      pageSize={PAGE_SIZE}
    />
  );
}
