import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = [
  "/",
  "/about",
  "/ministers",
  "/board",
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
];

const authRoutes = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

const financeRoles = ["FINANCE", "ADMIN", "SUPER_ADMIN"];
const adminRoles = ["ADMIN", "SUPER_ADMIN"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Allow API auth routes and static assets
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public routes: allow everyone
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/events/") ||
    pathname.startsWith("/api/content/") ||
    pathname.startsWith("/api/prayer-requests") ||
    pathname.startsWith("/api/testimonies") ||
    pathname.startsWith("/api/departments") ||
    pathname.startsWith("/api/paystack/webhook");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Auth routes: redirect to dashboard if already logged in
  const isAuthRoute = authRoutes.includes(pathname);
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // All routes below require authentication
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: require ADMIN or SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!userRole || !adminRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Finance routes: require FINANCE, ADMIN, or SUPER_ADMIN
  if (pathname.startsWith("/finance")) {
    if (!userRole || !financeRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // All other authenticated routes
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|ag-logo.png|images/).*)"],
};
