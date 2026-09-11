import { describe, it, expect } from "vitest";
import { isAllowedImageHost } from "@/lib/media-hosts";

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
