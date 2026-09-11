"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  blogPostSchema,
  eventSchema,
  sermonSchema,
  departmentSchema,
  liveStreamSchema,
} from "@/lib/validations/content";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { revalidateBlogPost, revalidateEvent, revalidateSermon } from "@/lib/revalidate";
import { deleteOwnedBlobs } from "@/lib/uploads/cleanup";

// ============================================================
// BLOG POSTS
// ============================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export async function createBlogPost(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    type: formData.get("type") as string,
    featuredImage: (formData.get("featuredImage") as string) || undefined,
    published: formData.get("published") as string,
  };

  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const isPublished = data.published === "on";
  let slug = generateSlug(data.title);

  try {
    // Ensure unique slug
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    await prisma.blogPost.create({
      data: {
        title: data.title.trim(),
        slug,
        content: sanitizeHtml(data.content),
        excerpt: data.excerpt ? sanitizeHtml(data.excerpt) : null,
        type: data.type as "BLOG" | "ANNOUNCEMENT" | "NEWS",
        featuredImage: data.featuredImage || null,
        published: isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: session.user.id,
      },
    });

    revalidateBlogPost(slug);
    return { success: true };
  } catch (err) {
    console.error("createBlogPost error:", err);
    return { success: false, error: "Failed to create blog post. Please try again." };
  }
}

export async function updateBlogPost(id: string, formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    excerpt: (formData.get("excerpt") as string) || undefined,
    type: formData.get("type") as string,
    featuredImage: (formData.get("featuredImage") as string) || undefined,
    published: formData.get("published") as string,
  };

  const parsed = blogPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const isPublished = data.published === "on";

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    const newImage = data.featuredImage || null;
    if (existing.featuredImage && existing.featuredImage !== newImage) {
      const oldImage = existing.featuredImage;
      after(async () => {
        await deleteOwnedBlobs([oldImage]);
      });
    }

    await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title.trim(),
        content: sanitizeHtml(data.content),
        excerpt: data.excerpt ? sanitizeHtml(data.excerpt) : null,
        type: data.type as "BLOG" | "ANNOUNCEMENT" | "NEWS",
        featuredImage: newImage,
        published: isPublished,
        publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });

    revalidateBlogPost(existing.slug);
    return { success: true };
  } catch (err) {
    console.error("updateBlogPost error:", err);
    return { success: false, error: "Failed to update blog post. Please try again." };
  }
}

export async function deleteBlogPost(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await prisma.blogPost.delete({ where: { id } });
    if (deleted.featuredImage) {
      after(async () => {
        await deleteOwnedBlobs([deleted.featuredImage]);
      });
    }
    revalidateBlogPost("");
    return { success: true };
  } catch (err) {
    console.error("deleteBlogPost error:", err);
    return { success: false, error: "Failed to delete blog post." };
  }
}

// ============================================================
// EVENTS
// ============================================================

export async function createEvent(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    startDate: formData.get("startDate") as string,
    endDate: (formData.get("endDate") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    type: formData.get("type") as string,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
    isPublished: formData.get("isPublished") as string,
  };

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description ? sanitizeHtml(data.description) : null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || "AG Wuse, 53 Accra Street, Wuse Zone 5",
        type: data.type as "SERVICE" | "REVIVAL" | "CONFERENCE" | "OUTREACH" | "HARVEST" | "OTHER",
        imageUrl: data.imageUrl || null,
        isPublished: data.isPublished === "on",
        createdById: session.user.id,
      },
    });

    revalidateEvent("new");
    return { success: true };
  } catch (err) {
    console.error("createEvent error:", err);
    return { success: false, error: "Failed to create event. Please try again." };
  }
}

export async function updateEvent(id: string, formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    startDate: formData.get("startDate") as string,
    endDate: (formData.get("endDate") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    type: formData.get("type") as string,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
    isPublished: formData.get("isPublished") as string,
  };

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    const newImage = data.imageUrl || null;
    if (existing.imageUrl && existing.imageUrl !== newImage) {
      const oldImage = existing.imageUrl;
      after(async () => {
        await deleteOwnedBlobs([oldImage]);
      });
    }

    await prisma.event.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description ? sanitizeHtml(data.description) : null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || "AG Wuse, 53 Accra Street, Wuse Zone 5",
        type: data.type as "SERVICE" | "REVIVAL" | "CONFERENCE" | "OUTREACH" | "HARVEST" | "OTHER",
        imageUrl: newImage,
        isPublished: data.isPublished === "on",
      },
    });

    revalidateEvent(id);
    return { success: true };
  } catch (err) {
    console.error("updateEvent error:", err);
    return { success: false, error: "Failed to update event. Please try again." };
  }
}

export async function deleteEvent(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await prisma.event.delete({ where: { id } });
    if (deleted.imageUrl) {
      after(async () => {
        await deleteOwnedBlobs([deleted.imageUrl]);
      });
    }
    revalidateEvent(id);
    return { success: true };
  } catch (err) {
    console.error("deleteEvent error:", err);
    return { success: false, error: "Failed to delete event." };
  }
}

// ============================================================
// GALLERY
// ============================================================

export async function createGalleryImage(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const url = formData.get("url") as string;
  const caption = (formData.get("caption") as string) || null;
  const albumName = (formData.get("albumName") as string) || null;

  if (!url) {
    return { success: false, error: "Image URL is required" };
  }

  if (!url.startsWith("https://")) {
    return { success: false, error: "Image URL must use HTTPS" };
  }

  try {
    await prisma.galleryImage.create({
      data: {
        url,
        caption: caption ? caption.trim() : null,
        albumName: albumName ? albumName.trim() : null,
      },
    });

    revalidatePath("/admin/content/gallery");
    revalidatePath("/gallery");
    return { success: true };
  } catch (err) {
    console.error("createGalleryImage error:", err);
    return { success: false, error: "Failed to save gallery image." };
  }
}

export async function deleteGalleryImage(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await prisma.galleryImage.delete({ where: { id } });
    if (deleted.url) {
      after(async () => {
        await deleteOwnedBlobs([deleted.url, deleted.thumbnailUrl]);
      });
    }
    revalidatePath("/admin/content/gallery");
    revalidatePath("/gallery");
    return { success: true };
  } catch (err) {
    console.error("deleteGalleryImage error:", err);
    return { success: false, error: "Failed to delete gallery image." };
  }
}

// ============================================================
// SERMONS
// ============================================================

export async function createSermon(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    speaker: formData.get("speaker") as string,
    description: (formData.get("description") as string) || undefined,
    date: formData.get("date") as string,
    audioUrl: (formData.get("audioUrl") as string) || undefined,
    videoUrl: (formData.get("videoUrl") as string) || undefined,
    seriesName: (formData.get("seriesName") as string) || undefined,
  };

  const parsed = sermonSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await prisma.sermon.create({
      data: {
        title: data.title.trim(),
        speaker: data.speaker.trim(),
        description: data.description ? sanitizeHtml(data.description) : null,
        date: new Date(data.date),
        audioUrl: data.audioUrl || null,
        videoUrl: data.videoUrl || null,
        seriesName: data.seriesName ? data.seriesName.trim() : null,
      },
    });

    revalidateSermon();
    return { success: true };
  } catch (err) {
    console.error("createSermon error:", err);
    return { success: false, error: "Failed to create sermon. Please try again." };
  }
}

export async function updateSermon(id: string, formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    title: formData.get("title") as string,
    speaker: formData.get("speaker") as string,
    description: (formData.get("description") as string) || undefined,
    date: formData.get("date") as string,
    audioUrl: (formData.get("audioUrl") as string) || undefined,
    videoUrl: (formData.get("videoUrl") as string) || undefined,
    seriesName: (formData.get("seriesName") as string) || undefined,
  };

  const parsed = sermonSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    const existing = await prisma.sermon.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Sermon not found" };
    }

    const newAudio = data.audioUrl || null;
    if (existing.audioUrl && existing.audioUrl !== newAudio) {
      const oldAudio = existing.audioUrl;
      after(async () => {
        await deleteOwnedBlobs([oldAudio]);
      });
    }

    await prisma.sermon.update({
      where: { id },
      data: {
        title: data.title.trim(),
        speaker: data.speaker.trim(),
        description: data.description ? sanitizeHtml(data.description) : null,
        date: new Date(data.date),
        audioUrl: newAudio,
        videoUrl: data.videoUrl || null,
        seriesName: data.seriesName ? data.seriesName.trim() : null,
      },
    });

    revalidateSermon();
    return { success: true };
  } catch (err) {
    console.error("updateSermon error:", err);
    return { success: false, error: "Failed to update sermon. Please try again." };
  }
}

export async function deleteSermon(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await prisma.sermon.delete({ where: { id } });
    if (deleted.audioUrl) {
      after(async () => {
        await deleteOwnedBlobs([deleted.audioUrl]);
      });
    }
    revalidateSermon();
    return { success: true };
  } catch (err) {
    console.error("deleteSermon error:", err);
    return { success: false, error: "Failed to delete sermon." };
  }
}

// ============================================================
// MODERATION (Submissions)
// ============================================================

export async function approveSubmission(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    await prisma.submission.update({
      where: { id },
      data: { status: "APPROVED", isPublic: true },
    });
    revalidatePath("/admin/content/moderation");
    revalidatePath("/testimony");
    return { success: true };
  } catch (err) {
    console.error("approveSubmission error:", err);
    return { success: false, error: "Failed to approve submission." };
  }
}

export async function archiveSubmission(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    await prisma.submission.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    revalidatePath("/admin/content/moderation");
    return { success: true };
  } catch (err) {
    console.error("archiveSubmission error:", err);
    return { success: false, error: "Failed to archive submission." };
  }
}

// ============================================================
// DEPARTMENTS
// ============================================================

export async function createDepartment(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    category: formData.get("category") as string,
    leaderId: (formData.get("leaderId") as string) || undefined,
  };

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await prisma.department.create({
      data: {
        name: data.name.trim(),
        description: data.description ? sanitizeHtml(data.description) : null,
        category: data.category as "MINISTRY" | "COMMITTEE" | "CHOIR" | "OUTREACH",
        leaderId: data.leaderId || null,
      },
    });

    revalidatePath("/admin/settings/departments");
    revalidatePath("/departments");
    revalidatePath("/leaders");
    return { success: true };
  } catch (err) {
    console.error("createDepartment error:", err);
    return { success: false, error: "Failed to create department. Name may already be in use." };
  }
}

export async function updateDepartment(id: string, formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    category: formData.get("category") as string,
    leaderId: (formData.get("leaderId") as string) || undefined,
    isActive: formData.get("isActive") !== "false",
  };

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await prisma.department.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description ? sanitizeHtml(data.description) : null,
        category: data.category as "MINISTRY" | "COMMITTEE" | "CHOIR" | "OUTREACH",
        leaderId: data.leaderId || null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/admin/settings/departments");
    revalidatePath("/departments");
    revalidatePath("/leaders");
    return { success: true };
  } catch (err) {
    console.error("updateDepartment error:", err);
    return { success: false, error: "Failed to update department. Name may already be in use." };
  }
}

export async function deleteDepartment(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    await prisma.$transaction(async (tx) => {
      // Nullify departmentId for any members assigned to this department
      await tx.user.updateMany({
        where: { departmentId: id },
        data: { departmentId: null },
      });
      await tx.department.delete({ where: { id } });
    });

    revalidatePath("/admin/settings/departments");
    revalidatePath("/departments");
    revalidatePath("/leaders");
    return { success: true };
  } catch (err) {
    console.error("deleteDepartment error:", err);
    return { success: false, error: "Failed to delete department." };
  }
}

// ============================================================
// CHURCH SETTINGS
// ============================================================

const ALLOWED_SETTING_KEYS = new Set([
  "church_name",
  "church_short_name",
  "church_address",
  "church_phones",
  "church_email",
  "church_tagline",
  "bank_name",
  "bank_account",
  "service_times",
]);

export async function updateChurchSetting(key: string, value: string) {
  await requireRole(["SUPER_ADMIN"]);

  if (!ALLOWED_SETTING_KEYS.has(key)) {
    return { success: false, error: `Invalid setting key: ${key}` };
  }

  try {
    await prisma.churchSettings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    console.error("updateChurchSetting error:", err);
    return { success: false, error: "Failed to update church setting." };
  }
}

// ============================================================
// LIVE STREAM
// ============================================================

export async function updateLiveStreamConfig(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = Object.fromEntries(formData);
  const parsed = liveStreamSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await prisma.liveStreamConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        youtubeUrl: data.youtubeUrl || null,
        facebookUrl: data.facebookUrl || null,
        isLive: data.isLive === "on",
        title: data.title ? data.title.trim() : null,
        description: data.description ? sanitizeHtml(data.description) : null,
      },
      update: {
        youtubeUrl: data.youtubeUrl || null,
        facebookUrl: data.facebookUrl || null,
        isLive: data.isLive === "on",
        title: data.title ? data.title.trim() : null,
        description: data.description ? sanitizeHtml(data.description) : null,
      },
    });

    revalidatePath("/admin/content/livestream");
    revalidatePath("/live");
    return { success: true };
  } catch (err) {
    console.error("updateLiveStreamConfig error:", err);
    return { success: false, error: "Failed to update live stream configuration." };
  }
}
