/**
 * Pure route-access resolution for the proxy / middleware layer.
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
]);

const authPaths = new Set([
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

/**
 * API paths that are accessible without authentication.
 * Includes Paystack endpoints so logged-out visitors can give online.
 */
const publicApiPrefixes = [
  "/api/auth",
  "/api/paystack/initialize",
  "/api/paystack/verify",
  "/api/paystack/webhook",
  "/api/content/",
  "/api/prayer-requests",
  "/api/testimonies",
  "/api/departments",
];

/**
 * Static asset patterns that should always be allowed through.
 */
const staticPrefixes = ["/_next", "/favicon"];
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

function isStaticAsset(pathname: string): boolean {
  if (staticPrefixes.some((p) => pathname.startsWith(p))) return true;
  const lastDot = pathname.lastIndexOf(".");
  if (lastDot > 0) {
    const ext = pathname.slice(lastDot).toLowerCase();
    return staticExtensions.has(ext);
  }
  return false;
}

function isPublicPath(pathname: string): boolean {
  if (publicPaths.has(pathname)) return true;
  if (pathname.startsWith("/blog/")) return true;
  if (pathname.startsWith("/events/")) return true;
  if (pathname.startsWith("/gallery/page/")) return true;
  return false;
}

function isPublicApi(pathname: string): boolean {
  return publicApiPrefixes.some((p) => pathname.startsWith(p));
}

// ---------- main ----------

export function resolveRouteAccess(
  pathname: string,
  ctx: RouteContext,
): RouteDecision {
  // 1. Static assets — always allow
  if (isStaticAsset(pathname)) return { action: "allow" };

  // 2. Public API — always allow
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
    if (pathname.startsWith("/api/")) {
      return {
        action: "json",
        status: 401,
        body: { error: "Authentication required" },
      };
    }
    return {
      action: "redirect",
      target: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
    };
  }

  // 6. Admin routes
  if (pathname.startsWith("/admin")) {
    if (!ctx.role || !adminRoles.has(ctx.role)) {
      return { action: "redirect", target: "/dashboard" };
    }
    return { action: "allow" };
  }

  // 7. Finance routes
  if (pathname.startsWith("/finance")) {
    if (!ctx.role || !financeRoles.has(ctx.role)) {
      return { action: "redirect", target: "/dashboard" };
    }
    return { action: "allow" };
  }

  // 8. All other authenticated routes
  return { action: "allow" };
}
