import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));
import { sendEmail } from "@/lib/email/send";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.clearAllMocks(); });
const mail = { to: "test@example.test", subject: "Verify", react: createElement("a", { href: "http://localhost:3000/verify-email?token=local-test" }, "Verify"), idempotencyKey: "receipt-123" };
describe("email transport failures", () => {
  it("passes idempotency in SDK request options", async () => {
    vi.stubEnv("EMAIL_TRANSPORT", "resend"); vi.stubEnv("RESEND_API_KEY", "re_test");
    mocks.send.mockResolvedValue({ data: { id: "accepted" }, error: null });
    expect(await sendEmail(mail)).toMatchObject({ success: true });
    expect(mocks.send).toHaveBeenLastCalledWith(expect.not.objectContaining({ headers: expect.anything() }), { idempotencyKey: "receipt-123" });
  });
  it.each([{ data: null, error: { message: "Rejected" } }, { data: null, error: null }])("reports provider rejection or missing acknowledgement", async (result) => {
    vi.stubEnv("EMAIL_TRANSPORT", "resend"); vi.stubEnv("RESEND_API_KEY", "re_test");
    mocks.send.mockResolvedValue(result);
    expect((await sendEmail(mail)).success).toBe(false);
  });
  it("prints usable local verification links", async () => {
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("EMAIL_TRANSPORT", "log");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    expect((await sendEmail(mail)).success).toBe(true);
    expect(log.mock.calls.flat().join(" ")).toContain("http://localhost:3000/verify-email?token=local-test");
  });
  it("rejects production logging", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("EMAIL_TRANSPORT", "log");
    expect((await sendEmail(mail)).success).toBe(false);
  });

  it.each([
    ["RESEND_API_KEY", ""], ["RESEND_API_KEY", "invalid"],
    ["EMAIL_FROM", ""], ["EMAIL_FROM", "invalid"],
  ])("rejects invalid production %s before contacting the provider", async (key, value) => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("EMAIL_TRANSPORT", "resend");
    vi.stubEnv("RESEND_API_KEY", "re_test"); vi.stubEnv("EMAIL_FROM", "AG Wuse <test@example.test>");
    vi.stubEnv(key, value);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await sendEmail(mail)).success).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"event":"email_delivery_failed"'));
  });
});
