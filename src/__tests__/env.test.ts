import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnv } from "@/lib/env";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PHASE", undefined);
  vi.stubEnv("DATABASE_URL", "postgresql://localhost/app");
  vi.stubEnv("AUTH_SECRET", "startup-regression-test-secret");
  vi.stubEnv("EMAIL_TRANSPORT", "resend");
  vi.stubEnv("EMAIL_FROM", "AG Wuse <test@example.test>");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("production startup", () => {
  it.each([
    ["EMAIL_TRANSPORT", "log"], ["RESEND_API_KEY", ""],
    ["RESEND_API_KEY", "invalid"], ["EMAIL_FROM", ""], ["EMAIL_FROM", "invalid"],
  ])("reports invalid %s without taking down unrelated routes", (key, value) => {
    vi.stubEnv(key, value);
    expect(() => validateEnv()).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"event":"email_configuration_invalid"'));
    expect(vi.mocked(console.error).mock.calls.flat().join(" ")).not.toContain("re_test");
  });
  it("still rejects missing core database configuration", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => validateEnv()).toThrow("DATABASE_URL");
  });
  it("accepts valid production email configuration", () => {
    expect(validateEnv().EMAIL_TRANSPORT).toBe("resend");
    expect(console.error).not.toHaveBeenCalled();
  });
});
