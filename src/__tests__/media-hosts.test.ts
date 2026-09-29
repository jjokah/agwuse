import { describe, it, expect } from "vitest";
import { isAllowedImageHost, REMOTE_IMAGE_PATTERNS } from "@/lib/media-hosts";

describe("isAllowedImageHost", () => {
  it("allows root-relative local paths", () => {
    expect(isAllowedImageHost("/images/logo.png")).toBe(true);
    expect(isAllowedImageHost("/ag-logo.png")).toBe(true);
  });

  it("disallows protocol-relative URLs", () => {
    expect(isAllowedImageHost("//evil.com/image.png")).toBe(false);
  });

  it("allows configured image hosts", () => {
    expect(isAllowedImageHost("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(true);
    expect(isAllowedImageHost("https://images.unsplash.com/photo-12345")).toBe(true);
    expect(isAllowedImageHost("https://img.youtube.com/vi/abc/hqdefault.jpg")).toBe(true);
    expect(isAllowedImageHost("https://subdomain.public.blob.vercel-storage.com/photo.jpg")).toBe(true);
  });

  it("rejects untrusted hosts and non-https schemes", () => {
    expect(isAllowedImageHost("http://res.cloudinary.com/photo.jpg")).toBe(false);
    expect(isAllowedImageHost("https://malicious-site.com/photo.jpg")).toBe(false);
    expect(isAllowedImageHost("javascript:alert(1)")).toBe(false);
    expect(isAllowedImageHost(null)).toBe(false);
    expect(isAllowedImageHost("")).toBe(false);
  });
});

describe("REMOTE_IMAGE_PATTERNS (next/image)", () => {
  // Use Next's own matcher so the config and isAllowedImageHost can't drift apart.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { hasRemoteMatch } = require("next/dist/shared/lib/match-remote-pattern") as {
    hasRemoteMatch: (domains: string[], patterns: unknown[], url: URL) => boolean;
  };

  const accepts = (url: string) => hasRemoteMatch([], REMOTE_IMAGE_PATTERNS, new URL(url));

  it("matches real Vercel Blob store URLs", () => {
    expect(accepts("https://abc123xyz.public.blob.vercel-storage.com/blog/1-photo.jpg")).toBe(true);
  });

  it("agrees with isAllowedImageHost for remote URLs", () => {
    const urls = [
      "https://abc123xyz.public.blob.vercel-storage.com/x.jpg",
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      "https://i.ytimg.com/vi/abc/hqdefault.jpg",
      "https://evil.com/x.jpg",
      "https://public.blob.vercel-storage.com.evil.com/x.jpg",
    ];
    for (const url of urls) {
      expect(accepts(url)).toBe(isAllowedImageHost(url));
    }
  });
});
