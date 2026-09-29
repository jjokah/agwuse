/**
 * Helper for public list loaders during Next.js build.
 *
 * In Next.js with ISR (revalidate), `next build` attempts to prerender pages.
 * If the database is not accessible at build time (e.g. CI without running DB, or local build),
 * we return a fallback value (such as empty list) so the build succeeds.
 *
 * At runtime, we rethrow the error so that:
 * 1. An error boundary ((public)/error.tsx) catches it rather than displaying a misleading "empty" state.
 * 2. Next.js ISR keeps serving the stale cached page rather than overwriting the cache with "No items".
 */
export async function withBuildFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return fallback;
    }
    throw err;
  }
}
