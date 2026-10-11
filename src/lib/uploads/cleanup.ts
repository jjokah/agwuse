/**
 * Safe cleanup utilities for Vercel Blob assets.
 * Only deletes blobs whose URLs belong to the church's Vercel Blob store.
 */

export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "blob.vercel-storage.com" ||
      hostname.endsWith(".blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

export async function deleteOwnedBlobs(
  urls: (string | null | undefined)[]
): Promise<{ deleted: number; errors: number }> {
  const blobUrls = [...new Set(urls.filter((u): u is string => isVercelBlobUrl(u)))];
  if (blobUrls.length === 0) {
    return { deleted: 0, errors: 0 };
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn(
      `[BLOB CLEANUP] BLOB_READ_WRITE_TOKEN is not configured; skipping deletion of ${blobUrls.length} blob(s).`
    );
    return { deleted: 0, errors: 0 };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const unreferenced: string[] = [];
    for (const url of blobUrls) {
      const counts = await Promise.all([
        prisma.user.count({ where: { OR: [{ image: url }, { profilePhoto: url }] } }),
        prisma.blogPost.count({ where: { OR: [{ featuredImage: url }, { content: { contains: url } }] } }),
        prisma.event.count({ where: { imageUrl: url } }),
        prisma.galleryImage.count({ where: { OR: [{ url }, { thumbnailUrl: url }] } }),
        prisma.sermon.count({ where: { OR: [{ audioUrl: url }, { videoUrl: url }, { thumbnailUrl: url }] } }),
      ]);
      if (counts.every((count) => count === 0)) unreferenced.push(url);
    }
    if (unreferenced.length === 0) return { deleted: 0, errors: 0 };
    const { del } = await import("@vercel/blob");
    await del(unreferenced, { token });
    return { deleted: unreferenced.length, errors: 0 };
  } catch (err) {
    console.error(JSON.stringify({ event: "asset_cleanup_failed", count: blobUrls.length, reason: err instanceof Error ? err.message : "Unknown failure" }));
    return { deleted: 0, errors: blobUrls.length };
  }
}
