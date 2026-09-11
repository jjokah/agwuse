import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { withBuildFallback } from "@/lib/build-fallback";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/leaders",
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
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Dynamic blog posts (bounded query)
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await withBuildFallback(
      () =>
        prisma.blogPost.findMany({
          where: { published: true },
          select: { slug: true, updatedAt: true },
          orderBy: { publishedAt: "desc" },
          take: 5000,
        }),
      []
    );

    blogRoutes = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error("Failed to load blog posts for sitemap:", err);
  }

  // Dynamic events (bounded query)
  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await withBuildFallback(
      () =>
        prisma.event.findMany({
          where: { isPublished: true },
          select: { id: true, updatedAt: true },
          orderBy: { startDate: "desc" },
          take: 1000,
        }),
      []
    );

    eventRoutes = events.map((event) => ({
      url: `${SITE_URL}/events/${event.id}`,
      lastModified: event.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error("Failed to load events for sitemap:", err);
  }

  return [...staticRoutes, ...blogRoutes, ...eventRoutes];
}
