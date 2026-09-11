import { z } from "zod/v4";
import { isAllowedImageHost } from "@/lib/media-hosts";

/**
 * Validates an image URL against allowed remote hosts or root-relative paths.
 */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(2048, { error: "Image URL must be at most 2048 characters" })
  .refine((val) => isAllowedImageHost(val), {
    error: "Image URL must be hosted on an approved provider (Cloudinary, Unsplash, YouTube, Vercel Blob) or be a local path",
  });

export const optionalImageUrlSchema = z
  .union([imageUrlSchema, z.literal(""), z.null(), z.undefined()])
  .transform((val) => (val ? val : null));

export const mediaUrlSchema = z
  .string()
  .trim()
  .max(2048, { error: "Media URL must be at most 2048 characters" })
  .refine(
    (val) => {
      try {
        const u = new URL(val);
        return u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { error: "Media URL must be a valid HTTPS URL" },
  );

export const galleryImageSchema = z.object({
  imageUrl: imageUrlSchema,
  caption: z.string().max(200).optional().nullable(),
  albumName: z.string().max(100).optional().nullable(),
});

export type GalleryImageInput = z.infer<typeof galleryImageSchema>;
