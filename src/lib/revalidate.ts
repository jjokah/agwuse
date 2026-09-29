import { revalidatePath } from "next/cache";

/**
 * Revalidate all paths that display blog posts.
 * When a slug changes, pass the old slug as `prevSlug` to invalidate the former detail page.
 */
export function revalidateBlogPost(slug: string, prevSlug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/announcements");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/content/blog");
  if (prevSlug && prevSlug !== slug) {
    revalidatePath(`/blog/${prevSlug}`);
  }
}

/** Revalidate all paths that display events. */
export function revalidateEvent(id: string) {
  revalidatePath("/events");
  if (id) revalidatePath(`/events/${id}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/content/events");
}

/** Revalidate all paths that display sermons (the home page shows the latest one). */
export function revalidateSermon() {
  revalidatePath("/sermons");
  revalidatePath("/");
  revalidatePath("/admin/content/sermons");
}

/** Revalidate the gallery, including every prerendered /gallery/page/[n]. */
export function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/gallery/page/[n]", "page");
  revalidatePath("/admin/content/gallery");
}
