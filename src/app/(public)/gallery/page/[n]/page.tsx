import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withBuildFallback } from "@/lib/build-fallback";
import { GalleryView } from "@/components/public/gallery-view";

export const revalidate = 300;
export const dynamicParams = true;

const PAGE_SIZE = 24;

export async function generateStaticParams() {
  return [{ n: "1" }, { n: "2" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  return {
    title: `Gallery — Page ${n}`,
    description: `Photo gallery from AG Wuse Church events and activities (Page ${n}).`,
  };
}

export default async function GalleryPaginatedPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const pageNum = parseInt(n, 10);

  if (!Number.isFinite(pageNum) || pageNum < 1) {
    notFound();
  }

  const skip = (pageNum - 1) * PAGE_SIZE;

  const [images, total] = await withBuildFallback(
    () =>
      Promise.all([
        prisma.galleryImage.findMany({
          orderBy: [{ albumName: "asc" }, { sortOrder: "asc" }],
          take: PAGE_SIZE,
          skip,
        }),
        prisma.galleryImage.count(),
      ]),
    [[], 0],
  );

  return (
    <GalleryView
      images={images}
      total={total}
      currentPage={pageNum}
      pageSize={PAGE_SIZE}
    />
  );
}
