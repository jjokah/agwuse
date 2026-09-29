const FALLBACK = "/dashboard";
const DUMMY_ORIGIN = "http://internal.invalid";

/**
 * Returns `raw` only if it is a same-origin relative path; otherwise the fallback.
 *
 * Browsers treat "\" like "/" and strip tabs/newlines, so "/\evil.com" or
 * "/\t/evil.com" would become protocol-relative ("//evil.com") and leave the site.
 * Resolving against a dummy origin catches every such variant.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = FALLBACK): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  // Reject backslashes and control characters outright
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;

  try {
    const url = new URL(raw, DUMMY_ORIGIN);
    if (url.origin !== DUMMY_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
