"use server";

import { auditedMutation } from "@/lib/audited-mutation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  blogPostSchema,
  eventSchema,
  sermonSchema,
  departmentSchema,
  liveStreamSchema,
} from "@/lib/validations/content";
import { galleryImageSchema } from "@/lib/validations/media";
import { writeAuditLog } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { revalidateBlogPost, revalidateEvent, revalidateSermon, revalidateGallery } from "@/lib/revalidate";
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

    await auditedMutation(session.user.id, "CREATE_BLOG_POST", "BlogPost", (tx) => tx.blogPost.create({
      data: {
        title: data.title.trim(),
        slug,
        content: sanitizeHtml(data.content),
        excerpt: data.excerpt?.trim() || null,
        type: data.type as "BLOG" | "ANNOUNCEMENT" | "NEWS",
        featuredImage: data.featuredImage || null,
        published: isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: session.user.id,
      },
    }));

    revalidateBlogPost(slug);
    return { success: true };
  } catch (err) {
    console.error("createBlogPost error:", err);
    return { success: false, error: "Failed to create blog post. Please try again." };
  }
}

export async function updateBlogPost(id: string, formData: FormData) {
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

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    const newImage = data.featuredImage || null;

    await auditedMutation(session.user.id, "UPDATE_BLOG_POST", "BlogPost", (tx) => tx.blogPost.update({
      where: { id },
      data: {
        title: data.title.trim(),
        content: sanitizeHtml(data.content),
        excerpt: data.excerpt?.trim() || null,
        type: data.type as "BLOG" | "ANNOUNCEMENT" | "NEWS",
        featuredImage: newImage,
        published: isPublished,
        publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    }));

    if (existing.featuredImage && existing.featuredImage !== newImage) {
      const oldImage = existing.featuredImage;
      after(async () => {
        await deleteOwnedBlobs([oldImage]);
      });
    }

    revalidateBlogPost(existing.slug);
    return { success: true };
  } catch (err) {
    console.error("updateBlogPost error:", err);
    return { success: false, error: "Failed to update blog post. Please try again." };
  }
}

export async function deleteBlogPost(id: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await auditedMutation(session.user.id, "DELETE_BLOG_POST", "BlogPost", (tx) => tx.blogPost.delete({ where: { id } }));

    if (deleted.featuredImage) {
      after(async () => {
        await deleteOwnedBlobs([deleted.featuredImage]);
      });
    }
    revalidateBlogPost(deleted.slug);
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
    const created = await auditedMutation(session.user.id, "CREATE_EVENT", "Event", (tx) => tx.event.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location || "AG Wuse, 53 Accra Street, Wuse Zone 5",
        type: data.type as "SERVICE" | "REVIVAL" | "CONFERENCE" | "OUTREACH" | "HARVEST" | "OTHER",
        imageUrl: data.imageUrl || null,
        isPublished: data.isPublished === "on",
        createdById: session.user.id,
      },
    }));

    revalidateEvent(created.id);
    return { success: true };
  } catch (err) {
    console.error("createEvent error:", err);
    return { success: false, error: "Failed to create event. Please try again." };
  }
}

export async function updateEvent(id: string, formData: FormData) {
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
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    const newImage = data.imageUrl || null;

    await auditedMutation(session.user.id, "UPDATE_EVENT", "Event", (tx) => tx.event.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location || "AG Wuse, 53 Accra Street, Wuse Zone 5",
        type: data.type as "SERVICE" | "REVIVAL" | "CONFERENCE" | "OUTREACH" | "HARVEST" | "OTHER",
        imageUrl: newImage,
        isPublished: data.isPublished === "on",
      },
    }));

    if (existing.imageUrl && existing.imageUrl !== newImage) {
      const oldImage = existing.imageUrl;
      after(async () => {
        await deleteOwnedBlobs([oldImage]);
      });
    }

    revalidateEvent(id);
    return { success: true };
  } catch (err) {
    console.error("updateEvent error:", err);
    return { success: false, error: "Failed to update event. Please try again." };
  }
}

export async function deleteEvent(id: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await auditedMutation(session.user.id, "DELETE_EVENT", "Event", (tx) => tx.event.delete({ where: { id } }));

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
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const parsed = galleryImageSchema.safeParse({
    imageUrl: (formData.get("url") as string) ?? "",
    caption: (formData.get("caption") as string) || null,
    albumName: (formData.get("albumName") as string) || null,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { imageUrl, caption, albumName } = parsed.data;

  try {
    await auditedMutation(session.user.id, "CREATE_GALLERY_IMAGE", "GalleryImage", (tx) => tx.galleryImage.create({
      data: {
        url: imageUrl,
        caption: caption ? caption.trim() : null,
        albumName: albumName ? albumName.trim() : null,
      },
    }));

    revalidateGallery();
    return { success: true };
  } catch (err) {
    console.error("createGalleryImage error:", err);
    return { success: false, error: "Failed to save gallery image." };
  }
}

export async function deleteGalleryImage(id: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await auditedMutation(session.user.id, "DELETE_GALLERY_IMAGE", "GalleryImage", (tx) => tx.galleryImage.delete({ where: { id } }));

    if (deleted.url) {
      after(async () => {
        await deleteOwnedBlobs([deleted.url, deleted.thumbnailUrl]);
      });
    }
    revalidateGallery();
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
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

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
    await auditedMutation(session.user.id, "CREATE_SERMON", "Sermon", (tx) => tx.sermon.create({
      data: {
        title: data.title.trim(),
        speaker: data.speaker.trim(),
        description: data.description?.trim() || null,
        date: new Date(data.date),
        audioUrl: data.audioUrl || null,
        videoUrl: data.videoUrl || null,
        seriesName: data.seriesName ? data.seriesName.trim() : null,
      },
    }));

    revalidateSermon();
    return { success: true };
  } catch (err) {
    console.error("createSermon error:", err);
    return { success: false, error: "Failed to create sermon. Please try again." };
  }
}

export async function updateSermon(id: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

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
    const newVideo = data.videoUrl || null;

    await auditedMutation(session.user.id, "UPDATE_SERMON", "Sermon", (tx) => tx.sermon.update({
      where: { id },
      data: {
        title: data.title.trim(),
        speaker: data.speaker.trim(),
        description: data.description?.trim() || null,
        date: new Date(data.date),
        audioUrl: newAudio,
        videoUrl: newVideo,
        seriesName: data.seriesName ? data.seriesName.trim() : null,
      },
    }));

    const replacedMedia = [
      existing.audioUrl !== newAudio ? existing.audioUrl : null,
      existing.videoUrl !== newVideo ? existing.videoUrl : null,
    ].filter((url): url is string => !!url);
    if (replacedMedia.length > 0) {
      after(async () => {
        await deleteOwnedBlobs(replacedMedia);
      });
    }

    revalidateSermon();
    return { success: true };
  } catch (err) {
    console.error("updateSermon error:", err);
    return { success: false, error: "Failed to update sermon. Please try again." };
  }
}

export async function deleteSermon(id: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    const deleted = await auditedMutation(session.user.id, "DELETE_SERMON", "Sermon", (tx) => tx.sermon.delete({ where: { id } }));

    if (deleted.audioUrl || deleted.videoUrl || deleted.thumbnailUrl) {
      after(async () => {
        await deleteOwnedBlobs([deleted.audioUrl, deleted.videoUrl, deleted.thumbnailUrl]);
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
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    await auditedMutation(session.user.id, "APPROVE_SUBMISSION", "Submission", (tx) => tx.submission.update({
      where: { id },
      // Respect the submitter's choice: approval never makes a private submission public.
      data: { status: "APPROVED" },
    }));
    revalidatePath("/admin/content/moderation");
    revalidatePath("/testimony");
    return { success: true };
  } catch (err) {
    console.error("approveSubmission error:", err);
    return { success: false, error: "Failed to approve submission." };
  }
}

export async function archiveSubmission(id: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    await auditedMutation(session.user.id, "ARCHIVE_SUBMISSION", "Submission", (tx) => tx.submission.update({
      where: { id },
      data: { status: "ARCHIVED" },
    }));
    revalidatePath("/admin/content/moderation");
    revalidatePath("/testimony");
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
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

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
    await auditedMutation(session.user.id, "CREATE_DEPARTMENT", "Department", (tx) => tx.department.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category as "MINISTRY" | "COMMITTEE" | "CHOIR" | "OUTREACH",
        leaderId: data.leaderId || null,
      },
    }));

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
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

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
    await auditedMutation(session.user.id, "UPDATE_DEPARTMENT", "Department", (tx) => tx.department.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category as "MINISTRY" | "COMMITTEE" | "CHOIR" | "OUTREACH",
        leaderId: data.leaderId || null,
        isActive: data.isActive ?? true,
      },
    }));

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
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  try {
    await prisma.$transaction(async (tx) => {
      // Nullify departmentId for any members assigned to this department
      await tx.user.updateMany({
        where: { departmentId: id },
        data: { departmentId: null },
      });
      await tx.department.delete({ where: { id } });
      await writeAuditLog({ action: "DELETE_DEPARTMENT", entity: "Department", entityId: id, userId: session.user.id }, tx);
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
// LIVE STREAM
// ============================================================

export async function updateLiveStreamConfig(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const raw = Object.fromEntries(formData);
  const parsed = liveStreamSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  try {
    await auditedMutation(session.user.id, "UPDATE_LIVE_STREAM_CONFIG", "LiveStreamConfig", (tx) => tx.liveStreamConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        youtubeUrl: data.youtubeUrl || null,
        facebookUrl: data.facebookUrl || null,
        isLive: data.isLive === "on",
        title: data.title ? data.title.trim() : null,
        description: data.description?.trim() || null,
      },
      update: {
        youtubeUrl: data.youtubeUrl || null,
        facebookUrl: data.facebookUrl || null,
        isLive: data.isLive === "on",
        title: data.title ? data.title.trim() : null,
        description: data.description?.trim() || null,
      },
    }));

    revalidatePath("/admin/content/livestream");
    revalidatePath("/live");
    return { success: true };
  } catch (err) {
    console.error("updateLiveStreamConfig error:", err);
    return { success: false, error: "Failed to update live stream configuration." };
  }
}
