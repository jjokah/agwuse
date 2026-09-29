import { z } from "zod/v4";
import { optionalImageUrlSchema, mediaUrlSchema } from "@/lib/validations/media";
import { parseLagosDateTime } from "@/lib/tz";

const optionalMediaUrlSchema = z
  .union([mediaUrlSchema, z.literal(""), z.null(), z.undefined()])
  .transform((val) => (val ? val : null));

export const YOUTUBE_EMBED_PREFIXES = [
  "https://www.youtube.com/embed/",
  "https://youtube.com/embed/",
  "https://www.youtube-nocookie.com/embed/",
];

export const FACEBOOK_EMBED_PREFIX = "https://www.facebook.com/plugins/video.php";

export const blogPostSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }).max(255),
  content: z.string().min(10, { error: "Content is required" }),
  excerpt: z.string().max(500).optional(),
  type: z.enum(["BLOG", "ANNOUNCEMENT", "NEWS"]),
  featuredImage: optionalImageUrlSchema,
  published: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }).max(255),
  description: z.string().optional(),
  // datetime-local values, interpreted as Africa/Lagos wall-clock time
  startDate: z
    .string()
    .min(1, { error: "Start date is required" })
    .transform((v, ctx) => {
      const d = parseLagosDateTime(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "Start date is invalid" });
        return z.NEVER;
      }
      return d;
    }),
  endDate: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const d = parseLagosDateTime(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "End date is invalid" });
        return z.NEVER;
      }
      return d;
    }),
  location: z.string().max(300).optional(),
  type: z.enum(["SERVICE", "REVIVAL", "CONFERENCE", "OUTREACH", "HARVEST", "OTHER"]),
  imageUrl: optionalImageUrlSchema,
  isPublished: z.string().optional(),
}).refine((e) => !e.endDate || e.endDate >= e.startDate, {
  error: "End date must be after the start date",
  path: ["endDate"],
});

export const sermonSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }).max(255),
  speaker: z.string().min(2, { error: "Speaker is required" }).max(150),
  description: z.string().optional(),
  date: z.string().min(1, { error: "Date is required" }),
  audioUrl: optionalMediaUrlSchema,
  videoUrl: optionalMediaUrlSchema,
  seriesName: z.string().max(150).optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(2, { error: "Name is required" }).max(150),
  description: z.string().optional(),
  category: z.enum(["MINISTRY", "COMMITTEE", "CHOIR", "OUTREACH"]),
  leaderId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const liveStreamSchema = z.object({
  youtubeUrl: z
    .string()
    .optional()
    .refine(
      (v) => !v || YOUTUBE_EMBED_PREFIXES.some((p) => v.startsWith(p)),
      { error: "YouTube URL must start with https://www.youtube.com/embed/" }
    ),
  facebookUrl: z
    .string()
    .optional()
    .refine((v) => !v || v.startsWith(FACEBOOK_EMBED_PREFIX), {
      error: "Facebook URL must start with https://www.facebook.com/plugins/video.php",
    }),
  isLive: z.string().optional(),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type SermonInput = z.infer<typeof sermonSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type LiveStreamInput = z.infer<typeof liveStreamSchema>;
