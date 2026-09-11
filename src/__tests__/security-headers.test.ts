import { describe, it, expect } from "vitest";
import { buildCsp, getSecurityHeaders } from "@/lib/security-headers";

describe("security-headers", () => {
  it("includes 'unsafe-eval' in dev CSP but excludes it in prod", () => {
    const devCsp = buildCsp({ isDev: true });
    expect(devCsp).toContain("'unsafe-eval'");

    const prodCsp = buildCsp({ isDev: false });
    expect(prodCsp).not.toContain("'unsafe-eval'");
  });

  it("includes required strict directives in CSP", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://www.youtube-nocookie.com");
    expect(csp).toContain("https://www.facebook.com");
  });

  it("adds HSTS only in production headers", () => {
    const devHeaders = getSecurityHeaders(true);
    expect(devHeaders.some((h) => h.key === "Strict-Transport-Security")).toBe(false);

    const prodHeaders = getSecurityHeaders(false);
    expect(prodHeaders.some((h) => h.key === "Strict-Transport-Security")).toBe(true);
  });
});
