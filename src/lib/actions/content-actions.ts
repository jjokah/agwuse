"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";

// ============================================================
// BLOG POSTS
// ============================================================

const blogPostSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }),
  content: z.string().min(10, { error: "Content is required" }),
  excerpt: z.string().optional(),
  type: z.enum(["BLOG", "ANNOUNCEMENT", "NEWS"]),
  featuredImage: z.string().optional(),
  published: z.string().optional(),
});

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

  // Ensure unique slug
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || null,
      type: data.type as "BLOG" | "ANNOUNCEMENT" | "NEWS",
      featuredImage: data.featuredImage || null,
      published: isPublished,
      publishedAt: isPublished ? new Date() : null,
      authorId: session.user.id,
    },
  });

  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");
  revalidatePath("/announcements");
  return { success: true };
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

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Post not found" };
  }

  await prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || null,
      type: data.type as "BLOG" | "ANNOUNCEMENT" | "NEWS",
      featuredImage: data.featuredImage || null,
      published: isPublished,
      publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");
  revalidatePath("/announcements");
  return { success: true };
}

export async function deleteBlogPost(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");
  return { success: true };
}

// ============================================================
// EVENTS
// ============================================================

const eventSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { error: "Start date is required" }),
  endDate: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["SERVICE", "REVIVAL", "CONFERENCE", "OUTREACH", "HARVEST", "OTHER"]),
  imageUrl: z.string().optional(),
  isPublished: z.string().optional(),
});

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

  await prisma.event.create({
    data: {
      title: data.title,
      description: data.description || null,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location || "AG Wuse, 53 Accra Street, Wuse Zone 5",
      type: data.type as "SERVICE" | "REVIVAL" | "CONFERENCE" | "OUTREACH" | "HARVEST" | "OTHER",
      imageUrl: data.imageUrl || null,
      isPublished: data.isPublished === "on",
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin/content/events");
  revalidatePath("/events");
  return { success: true };
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

  await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location || "AG Wuse, 53 Accra Street, Wuse Zone 5",
      type: data.type as "SERVICE" | "REVIVAL" | "CONFERENCE" | "OUTREACH" | "HARVEST" | "OTHER",
      imageUrl: data.imageUrl || null,
      isPublished: data.isPublished === "on",
    },
  });

  revalidatePath("/admin/content/events");
  revalidatePath("/events");
  return { success: true };
}

export async function deleteEvent(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  await prisma.event.delete({ where: { id } });
  revalidatePath("/admin/content/events");
  revalidatePath("/events");
  return { success: true };
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

  await prisma.galleryImage.create({
    data: { url, caption, albumName },
  });

  revalidatePath("/admin/content/gallery");
  revalidatePath("/gallery");
  return { success: true };
}

export async function deleteGalleryImage(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  await prisma.galleryImage.delete({ where: { id } });
  revalidatePath("/admin/content/gallery");
  revalidatePath("/gallery");
  return { success: true };
}

// ============================================================
// SERMONS
// ============================================================

const sermonSchema = z.object({
  title: z.string().min(2, { error: "Title is required" }),
  speaker: z.string().min(2, { error: "Speaker is required" }),
  description: z.string().optional(),
  date: z.string().min(1, { error: "Date is required" }),
  audioUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  seriesName: z.string().optional(),
});

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

  await prisma.sermon.create({
    data: {
      title: data.title,
      speaker: data.speaker,
      description: data.description || null,
      date: new Date(data.date),
      audioUrl: data.audioUrl || null,
      videoUrl: data.videoUrl || null,
      seriesName: data.seriesName || null,
    },
  });

  revalidatePath("/admin/content/sermons");
  revalidatePath("/sermons");
  return { success: true };
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

  await prisma.sermon.update({
    where: { id },
    data: {
      title: data.title,
      speaker: data.speaker,
      description: data.description || null,
      date: new Date(data.date),
      audioUrl: data.audioUrl || null,
      videoUrl: data.videoUrl || null,
      seriesName: data.seriesName || null,
    },
  });

  revalidatePath("/admin/content/sermons");
  revalidatePath("/sermons");
  return { success: true };
}

export async function deleteSermon(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  await prisma.sermon.delete({ where: { id } });
  revalidatePath("/admin/content/sermons");
  revalidatePath("/sermons");
  return { success: true };
}

// ============================================================
// MODERATION (Submissions)
// ============================================================

export async function approveSubmission(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  await prisma.submission.update({
    where: { id },
    data: { status: "APPROVED", isPublic: true },
  });
  revalidatePath("/admin/content/moderation");
  revalidatePath("/testimony");
  return { success: true };
}

export async function archiveSubmission(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  await prisma.submission.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/admin/content/moderation");
  return { success: true };
}

// ============================================================
// DEPARTMENTS
// ============================================================

const departmentSchema = z.object({
  name: z.string().min(2, { error: "Name is required" }),
  description: z.string().optional(),
  category: z.enum(["MINISTRY", "COMMITTEE", "CHOIR", "OUTREACH"]),
  leaderId: z.string().optional(),
});

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

  await prisma.department.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category as "MINISTRY" | "COMMITTEE" | "CHOIR" | "OUTREACH",
      leaderId: data.leaderId || null,
    },
  });

  revalidatePath("/admin/settings/departments");
  revalidatePath("/departments");
  return { success: true };
}

export async function updateDepartment(id: string, formData: FormData) {
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

  await prisma.department.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category as "MINISTRY" | "COMMITTEE" | "CHOIR" | "OUTREACH",
      leaderId: data.leaderId || null,
    },
  });

  revalidatePath("/admin/settings/departments");
  revalidatePath("/departments");
  return { success: true };
}

export async function deleteDepartment(id: string) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/settings/departments");
  revalidatePath("/departments");
  return { success: true };
}

// ============================================================
// CHURCH SETTINGS
// ============================================================

export async function updateChurchSetting(key: string, value: string) {
  await requireRole(["SUPER_ADMIN"]);
  await prisma.churchSettings.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  return { success: true };
}
