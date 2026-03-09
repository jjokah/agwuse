import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agwuse.magnisale.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/ministers",
    "/board",
    "/contact",
    "/give",
    "/departments",
    "/activities",
    "/join",
    "/blog",
    "/announcements",
    "/events",
    "/sermons",
    "/gallery",
    "/live",
    "/prayer-request",
    "/testimony",
    "/privacy-policy",
    "/terms",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Dynamic blog posts
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const blogRoutes = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic events
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true },
  });

  const eventRoutes = events.map((event) => ({
    url: `${BASE_URL}/events/${event.id}`,
    lastModified: event.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...eventRoutes];
}
