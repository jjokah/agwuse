import { describe, it, expect } from "vitest";
import { resolveRouteAccess } from "@/lib/route-access";

describe("resolveRouteAccess", () => {
  // --- Static assets ---
  it("allows static assets through", () => {
    expect(resolveRouteAccess("/_next/static/chunk.js", { isLoggedIn: false })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/favicon.ico", { isLoggedIn: false })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/images/logo.png", { isLoggedIn: false })).toEqual({ action: "allow" });
  });

  // --- Public routes ---
  it("allows public pages for anonymous users", () => {
    const publicPaths = ["/", "/about", "/blog", "/events", "/give", "/sermons", "/gallery"];
    for (const p of publicPaths) {
      expect(resolveRouteAccess(p, { isLoggedIn: false })).toEqual({ action: "allow" });
    }
  });

  it("allows public dynamic routes", () => {
    expect(resolveRouteAccess("/blog/some-slug", { isLoggedIn: false })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/events/abc123", { isLoggedIn: false })).toEqual({ action: "allow" });
  });

  // --- Public API (Paystack) ---
  it("allows Paystack initialize/verify/webhook for anonymous users", () => {
    expect(resolveRouteAccess("/api/paystack/initialize", { isLoggedIn: false })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/api/paystack/verify", { isLoggedIn: false })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/api/paystack/webhook", { isLoggedIn: false })).toEqual({ action: "allow" });
  });

  // --- Auth routes ---
  it("redirects logged-in users away from auth pages", () => {
    expect(resolveRouteAccess("/login", { isLoggedIn: true, role: "MEMBER" })).toEqual({
      action: "redirect",
      target: "/dashboard",
    });
    expect(resolveRouteAccess("/register", { isLoggedIn: true, role: "MEMBER" })).toEqual({
      action: "redirect",
      target: "/dashboard",
    });
  });

  it("allows anonymous users on auth pages", () => {
    expect(resolveRouteAccess("/login", { isLoggedIn: false })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/register", { isLoggedIn: false })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/verify-email", { isLoggedIn: false })).toEqual({ action: "allow" });
  });

  // --- Protected routes ---
  it("returns 401 JSON for unauthenticated API requests", () => {
    const result = resolveRouteAccess("/api/some-private", { isLoggedIn: false });
    expect(result).toEqual({
      action: "json",
      status: 401,
      body: { error: "Authentication required" },
    });
  });

  it("redirects unauthenticated users to login with callbackUrl", () => {
    const result = resolveRouteAccess("/dashboard", { isLoggedIn: false });
    expect(result).toEqual({
      action: "redirect",
      target: "/login?callbackUrl=%2Fdashboard",
    });
  });

  // --- Role-based access ---
  it("allows ADMIN on /admin", () => {
    expect(resolveRouteAccess("/admin/users", { isLoggedIn: true, role: "ADMIN" })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/admin", { isLoggedIn: true, role: "SUPER_ADMIN" })).toEqual({ action: "allow" });
  });

  it("redirects MEMBER from /admin", () => {
    expect(resolveRouteAccess("/admin", { isLoggedIn: true, role: "MEMBER" })).toEqual({
      action: "redirect",
      target: "/dashboard",
    });
  });

  it("allows FINANCE on /finance", () => {
    expect(resolveRouteAccess("/finance", { isLoggedIn: true, role: "FINANCE" })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/finance/reports", { isLoggedIn: true, role: "ADMIN" })).toEqual({ action: "allow" });
  });

  it("redirects MEMBER from /finance", () => {
    expect(resolveRouteAccess("/finance", { isLoggedIn: true, role: "MEMBER" })).toEqual({
      action: "redirect",
      target: "/dashboard",
    });
  });

  it("allows any logged-in user on general dashboard routes", () => {
    expect(resolveRouteAccess("/dashboard", { isLoggedIn: true, role: "MEMBER" })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/my-giving", { isLoggedIn: true, role: "VISITOR" })).toEqual({ action: "allow" });
    expect(resolveRouteAccess("/profile", { isLoggedIn: true, role: "MEMBER" })).toEqual({ action: "allow" });
  });
});
