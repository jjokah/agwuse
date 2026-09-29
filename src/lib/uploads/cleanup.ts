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
  const blobUrls = urls.filter((u): u is string => isVercelBlobUrl(u));
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
    const { del } = await import("@vercel/blob");
    await del(blobUrls, { token });
    return { deleted: blobUrls.length, errors: 0 };
  } catch (err) {
    console.error("[BLOB CLEANUP ERROR] Failed to delete blob(s):", err);
    return { deleted: 0, errors: blobUrls.length };
  }
}
