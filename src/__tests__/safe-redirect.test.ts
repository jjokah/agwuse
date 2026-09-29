import { describe, it, expect } from "vitest";
import { safeCallbackUrl } from "@/lib/safe-redirect";

describe("safeCallbackUrl", () => {
  it("keeps same-origin relative paths including the query string", () => {
    expect(safeCallbackUrl("/admin/users")).toBe("/admin/users");
    expect(safeCallbackUrl("/finance/transactions?page=2")).toBe("/finance/transactions?page=2");
  });

  it("falls back for missing or absolute URLs", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl("")).toBe("/dashboard");
    expect(safeCallbackUrl("https://evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/dashboard");
  });

  it("blocks protocol-relative tricks", () => {
    const bs = String.fromCharCode(92); // backslash
    const tab = String.fromCharCode(9);
    const nl = String.fromCharCode(10);
    const attempts = ["//evil.com", `/${bs}evil.com`, `/${tab}/evil.com`, `/${nl}/evil.com`, `/${bs}${bs}evil.com`];
    for (const raw of attempts) {
      expect(safeCallbackUrl(raw)).toBe("/dashboard");
    }
  });

  it("supports a custom fallback", () => {
    expect(safeCallbackUrl("//evil.com", "/")).toBe("/");
  });
});
