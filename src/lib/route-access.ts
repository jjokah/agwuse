/**
 * Pure route-access resolution for the proxy layer (src/proxy.ts).
 *
 * This module has NO dependencies on Node APIs, Prisma, or Next.js internals
 * so it can be unit-tested trivially.
 */

type RouteDecision =
  | { action: "allow" }
  | { action: "redirect"; target: string }
  | { action: "json"; status: number; body: { error: string } };

interface RouteContext {
  isLoggedIn: boolean;
  role?: string | null;
  /** Query string of the request (including the leading "?"), preserved in callbackUrl. */
  search?: string;
}

// ---------- route sets ----------

const publicPaths = new Set([
  "/",
  "/about",
  "/leaders",
  "/departments",
  "/activities",
  "/blog",
  "/announcements",
  "/events",
  "/gallery",
  "/sermons",
  "/live",
  "/prayer-request",
  "/testimony",
  "/join",
  "/contact",
  "/give",
  "/privacy-policy",
  "/terms",
  // Metadata routes generated from src/app
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

/** Public dynamic sections (the prefix itself must end with "/"). */
const publicPrefixes = ["/blog/", "/events/", "/gallery/page/", "/give/"];

/** Metadata image routes; Next may append a hash suffix (e.g. /opengraph-image-abc123). */
const publicMetadataPrefixes = ["/opengraph-image", "/twitter-image", "/icon", "/apple-icon"];

const authPaths = new Set([
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

/**
 * API paths that are reachable without a session. Each handler performs its own
 * authentication or signature verification:
 * - /api/auth: Auth.js
 * - /api/paystack/*: public giving (webhook is HMAC-verified)
 * - /api/upload: checks the session before issuing a token; Vercel Blob's
 *   upload-completed callback arrives without cookies and is signature-verified.
 */
const publicApiPrefixes = [
  "/api/auth/",
  "/api/paystack/initialize",
  "/api/paystack/verify",
  "/api/paystack/webhook",
  "/api/upload",
];

/** Paths that must always go through the auth checks, even if they look like a file. */
const protectedPrefixes = [
  "/admin",
  "/finance",
  "/api",
  "/dashboard",
  "/profile",
  "/my-giving",
  "/directory",
];

const staticPrefixes = ["/_next/", "/images/"];
const staticExtensions = new Set([
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
  ".css",
  ".js",
  ".map",
]);

const financeRoles = new Set(["FINANCE", "ADMIN", "SUPER_ADMIN"]);
const adminRoles = new Set(["ADMIN", "SUPER_ADMIN"]);

// ---------- helpers ----------

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((p) => matchesPrefix(pathname, p));
}

function isStaticAsset(pathname: string): boolean {
  if (staticPrefixes.some((p) => pathname.startsWith(p))) return true;
  // Only files served from /public qualify; never let an extension unlock a protected route.
  if (isProtectedPath(pathname)) return false;
  const lastDot = pathname.lastIndexOf(".");
  if (lastDot > pathname.lastIndexOf("/")) {
    return staticExtensions.has(pathname.slice(lastDot).toLowerCase());
  }
  return false;
}

function isPublicPath(pathname: string): boolean {
  if (publicPaths.has(pathname)) return true;
  if (publicPrefixes.some((p) => pathname.startsWith(p))) return true;
  if (publicMetadataPrefixes.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function isPublicApi(pathname: string): boolean {
  return publicApiPrefixes.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : matchesPrefix(pathname, p),
  );
}

// ---------- main ----------

export function resolveRouteAccess(
  pathname: string,
  ctx: RouteContext,
): RouteDecision {
  // 1. Static assets — always allow
  if (isStaticAsset(pathname)) return { action: "allow" };

  // 2. Public API — always allow (handlers authenticate themselves)
  if (isPublicApi(pathname)) return { action: "allow" };

  // 3. Public pages — always allow
  if (isPublicPath(pathname)) return { action: "allow" };

  // 4. Auth routes — redirect to dashboard if already logged in
  if (authPaths.has(pathname)) {
    if (ctx.isLoggedIn) return { action: "redirect", target: "/dashboard" };
    return { action: "allow" };
  }

  // 5. Everything below requires authentication
  if (!ctx.isLoggedIn) {
    // API requests get 401 JSON, not a redirect
    if (matchesPrefix(pathname, "/api")) {
      return {
        action: "json",
        status: 401,
        body: { error: "Authentication required" },
      };
    }
    return {
      action: "redirect",
      target: `/login?callbackUrl=${encodeURIComponent(pathname + (ctx.search ?? ""))}`,
    };
  }

  // 6. Admin routes
  if (matchesPrefix(pathname, "/admin")) {
    if (!ctx.role || !adminRoles.has(ctx.role)) {
      return { action: "redirect", target: "/dashboard" };
    }
    return { action: "allow" };
  }

  // 7. Finance routes
  if (matchesPrefix(pathname, "/finance")) {
    if (!ctx.role || !financeRoles.has(ctx.role)) {
      return { action: "redirect", target: "/dashboard" };
    }
    return { action: "allow" };
  }

  // 8. All other authenticated routes
  return { action: "allow" };
}
