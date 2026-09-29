/**
 * Single source of truth for allowed remote image domains.
 * Feeds next.config.ts remotePatterns and runtime image validation.
 */
export const ALLOWED_IMAGE_HOSTS = [
  "res.cloudinary.com",
  "images.unsplash.com",
  "img.youtube.com",
  "i.ytimg.com",
  // Vercel Blob serves files from <store-id>.public.blob.vercel-storage.com
  "public.blob.vercel-storage.com",
] as const;

export type AllowedImageHost = (typeof ALLOWED_IMAGE_HOSTS)[number];

/**
 * next/image remotePatterns matching exactly the hosts accepted by
 * isAllowedImageHost: each host itself plus any of its subdomains.
 * (An exact hostname pattern does not match subdomains, which broke every
 * Vercel Blob upload.)
 */
export const REMOTE_IMAGE_PATTERNS = ALLOWED_IMAGE_HOSTS.flatMap((hostname) => [
  { protocol: "https" as const, hostname },
  { protocol: "https" as const, hostname: `**.${hostname}` },
]);

/**
 * Validates whether an image URL is hosted on an allowed remote host
 * or is a local root-relative path (e.g. /images/...).
 */
export function isAllowedImageHost(urlStr: string | null | undefined): boolean {
  if (!urlStr) return false;

  // Local relative images are always allowed
  if (urlStr.startsWith("/") && !urlStr.startsWith("//") && !urlStr.startsWith("/\\")) {
    return true;
  }

  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();

    return ALLOWED_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}
