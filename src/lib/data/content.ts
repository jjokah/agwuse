import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Request-scoped cached loader for published blog posts by slug.
 * Shared between generateMetadata and page component.
 */
export const getBlogPostBySlug = cache(async (slug: string) => {
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
});

/**
 * Request-scoped cached loader for published events by ID.
 * Shared between generateMetadata and page component.
 */
export const getEventById = cache(async (id: string) => {
  return prisma.event.findUnique({
    where: { id, isPublished: true },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
});
