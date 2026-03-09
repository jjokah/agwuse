import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageIcon } from "lucide-react";
import { GalleryManager } from "./gallery-manager";

export const metadata: Metadata = {
  title: "Gallery Management",
};

export default async function AdminGalleryPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const images = await prisma.galleryImage.findMany({
    orderBy: [{ albumName: "asc" }, { sortOrder: "asc" }],
  });

  const albums = Array.from(new Set(images.map((i) => i.albumName).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gallery</h1>

      <GalleryManager images={images} albums={albums} />

      {images.length === 0 && (
        <EmptyState
          icon={<ImageIcon />}
          title="No images yet"
          description="Add your first gallery image above."
        />
      )}
    </div>
  );
}
