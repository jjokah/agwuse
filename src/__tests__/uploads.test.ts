import { describe, it, expect } from "vitest";
import {
  validateUploadPath,
  isRoleAllowedForFolder,
  UPLOAD_POLICIES,
} from "@/lib/uploads/policy";
import { isVercelBlobUrl, deleteOwnedBlobs } from "@/lib/uploads/cleanup";

describe("Uploads Policy & Path Validation", () => {
  it("rejects path traversal attempts", () => {
    expect(validateUploadPath("../etc/passwd").valid).toBe(false);
    expect(validateUploadPath("gallery/../../secret.txt").valid).toBe(false);
    expect(validateUploadPath("blog/..\\evil.png").valid).toBe(false);
    expect(validateUploadPath("/gallery/image.png").valid).toBe(false);
    expect(validateUploadPath("gallery//image.png").valid).toBe(false);
    expect(validateUploadPath("gallery/null\0byte.png").valid).toBe(false);
  });

  it("rejects unknown or unauthorized target folders", () => {
    expect(validateUploadPath("passwords/key.txt").valid).toBe(false);
    expect(validateUploadPath("system/config.json").valid).toBe(false);
    expect(validateUploadPath("").valid).toBe(false);
    expect(validateUploadPath("gallery").valid).toBe(false);
    expect(validateUploadPath("gallery/sub/nested.png").valid).toBe(false);
  });

  it("rejects illegal filename characters", () => {
    expect(validateUploadPath("gallery/image<test>.png").valid).toBe(false);
    expect(validateUploadPath("gallery/image:col.png").valid).toBe(false);
    expect(validateUploadPath("gallery/image|pipe.png").valid).toBe(false);
    expect(validateUploadPath("gallery/image*star.png").valid).toBe(false);
    expect(validateUploadPath("gallery/ab").valid).toBe(false);
  });

  it("accepts valid canonical upload paths", () => {
    const galleryRes = validateUploadPath("gallery/1726000000-photo.jpg");
    expect(galleryRes.valid).toBe(true);
    expect(galleryRes.folder).toBe("gallery");
    expect(galleryRes.filename).toBe("1726000000-photo.jpg");

    expect(validateUploadPath("blog/announcement.webp").valid).toBe(true);
    expect(validateUploadPath("events/convention-banner.png").valid).toBe(true);
    expect(validateUploadPath("sermons/sunday-audio.mp3").valid).toBe(true);
    expect(validateUploadPath("avatars/user-profile.jpg").valid).toBe(true);
  });

  it("enforces role-based permissions per folder", () => {
    expect(isRoleAllowedForFolder("SUPER_ADMIN", "gallery")).toBe(true);
    expect(isRoleAllowedForFolder("ADMIN", "blog")).toBe(true);
    expect(isRoleAllowedForFolder("MEMBER", "gallery")).toBe(false);
    expect(isRoleAllowedForFolder("VISITOR", "events")).toBe(false);
    expect(isRoleAllowedForFolder("FINANCE", "sermons")).toBe(false);

    // Any member can upload an avatar
    expect(isRoleAllowedForFolder("MEMBER", "avatars")).toBe(true);
    expect(isRoleAllowedForFolder("ADMIN", "avatars")).toBe(true);
  });

  it("defines appropriate MIME types and size caps", () => {
    expect(UPLOAD_POLICIES.gallery.maxSizeBytes).toBe(15 * 1024 * 1024);
    expect(UPLOAD_POLICIES.gallery.allowedMimeTypes).toContain("image/jpeg");
    expect(UPLOAD_POLICIES.gallery.allowedMimeTypes).toContain("image/gif");

    expect(UPLOAD_POLICIES.blog.maxSizeBytes).toBe(8 * 1024 * 1024);
    expect(UPLOAD_POLICIES.events.maxSizeBytes).toBe(8 * 1024 * 1024);
    expect(UPLOAD_POLICIES.sermons.allowedMimeTypes).toContain("audio/mpeg");
    expect(UPLOAD_POLICIES.avatars.maxSizeBytes).toBe(2 * 1024 * 1024);
  });
});

describe("Vercel Blob Cleanup & URL Detection", () => {
  it("identifies valid Vercel Blob URLs", () => {
    expect(
      isVercelBlobUrl("https://abc123xyz.public.blob.vercel-storage.com/gallery/img.jpg")
    ).toBe(true);
    expect(
      isVercelBlobUrl("https://blob.vercel-storage.com/avatars/user.png")
    ).toBe(true);
  });

  it("rejects non-blob or malicious URLs", () => {
    expect(isVercelBlobUrl("https://malicious.com/file.jpg")).toBe(false);
    expect(isVercelBlobUrl("https://notblob.vercel-storage.com.attacker.com/x.jpg")).toBe(false);
    expect(isVercelBlobUrl("http://blob.vercel-storage.com/insecure.jpg")).toBe(false);
    expect(isVercelBlobUrl(null)).toBe(false);
    expect(isVercelBlobUrl(undefined)).toBe(false);
    expect(isVercelBlobUrl("not-a-url")).toBe(false);
  });

  it("filters out non-blob URLs before cleanup", async () => {
    const res = await deleteOwnedBlobs([
      "https://images.unsplash.com/photo-1",
      "/local-image.png",
      null,
    ]);
    expect(res).toEqual({ deleted: 0, errors: 0 });
  });
});
