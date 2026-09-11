import { revalidatePath } from "next/cache";

/**
 * Revalidate all paths that display blog posts.
 * When a slug changes, pass the old slug as `prevSlug` to invalidate the former detail page.
 */
export function revalidateBlogPost(slug: string, prevSlug?: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/announcements");
  revalidatePath("/");
  revalidatePath("/admin/content/blog");
  if (prevSlug && prevSlug !== slug) {
    revalidatePath(`/blog/${prevSlug}`);
  }
}

/** Revalidate all paths that display events. */
export function revalidateEvent(id: string) {
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  revalidatePath("/");
  revalidatePath("/admin/content/events");
}

/** Revalidate all paths that display sermons. */
export function revalidateSermon() {
  revalidatePath("/sermons");
  revalidatePath("/admin/content/sermons");
}
