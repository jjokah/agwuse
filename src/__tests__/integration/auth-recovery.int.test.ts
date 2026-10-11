import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  verify: vi.fn<(email: string, token: string) => Promise<{ success: boolean }>>(async () => ({ success: true })), reset: vi.fn(async () => ({ success: true })),
  guidance: vi.fn(async () => ({ success: true })), limit: vi.fn(async () => ({ success: true })),
}));
vi.mock("@/lib/auth", () => ({ signIn: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class extends Error {} }));
vi.mock("@/lib/ratelimit", () => ({ getClientIp: async () => "127.0.0.1", checkRateLimit: mocks.limit, checkDualRateLimit: mocks.limit }));
vi.mock("@/lib/email/send", () => ({ sendVerificationEmail: mocks.verify, sendPasswordResetEmail: mocks.reset, sendRegistrationAttemptEmail: mocks.guidance, sendNewRegistrationEmail: vi.fn() }));
vi.mock("@/lib/settings", () => ({ getChurchInfo: async () => ({ notificationEmails: [] }) }));
vi.mock("next/server", async (original) => ({ ...(await original<typeof import("next/server")>()), after: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { createToken, hashToken } from "@/lib/tokens";
import { registerUser, resendVerification, requestPasswordReset, verifyEmail, resetPassword } from "@/lib/actions/auth-actions";
import { resetDatabase, createUser, formData } from "./helpers";
import { compare } from "bcryptjs";

beforeEach(async () => { await resetDatabase(); vi.clearAllMocks(); mocks.verify.mockResolvedValue({ success: true }); mocks.limit.mockResolvedValue({ success: true }); });
afterAll(async () => { await prisma.$disconnect(); });
const registration = () => formData({ firstName: "Recovery", lastName: "Tester", email: " RECOVERY@example.test ", phone: "", password: "SafePassword123", confirmPassword: "SafePassword123" });

describe("account recovery transactions", () => {
  it("recovers failed delivery by resending without creating another account", async () => {
    mocks.verify.mockResolvedValueOnce({ success: false });
    expect((await registerUser(registration())).success).toBe(false);
    expect(await prisma.user.count()).toBe(1);
    expect(await resendVerification(formData({ email: "recovery@example.test" }))).toEqual({ success: true });
    expect(await prisma.user.count()).toBe(1);
    expect(mocks.verify).toHaveBeenCalledTimes(2);
    const [, token] = mocks.verify.mock.calls.at(-1)!;
    expect(await verifyEmail(token)).toEqual({ success: true });
    expect((await prisma.user.findFirstOrThrow()).status).toBe("PENDING");
  });
  it("duplicate unverified registration sends verification, never password reset", async () => {
    await registerUser(registration());
    await registerUser(registration());
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.token.count({ where: { type: "PASSWORD_RESET" } })).toBe(0);
    expect(mocks.verify).toHaveBeenCalledTimes(2);
  });
  it("verified registration leaves existing reset tokens intact", async () => {
    await registerUser(registration());
    await prisma.user.updateMany({ data: { emailVerified: new Date() } });
    const token = await createToken({ email: "recovery@example.test", type: "PASSWORD_RESET" });
    await registerUser(registration());
    expect(await prisma.token.findUnique({ where: { tokenHash: hashToken(token) } })).not.toBeNull();
    expect(mocks.guidance).toHaveBeenCalledWith("recovery@example.test");
  });
  it("expired tokens fail and concurrent verification consumes a token once", async () => {
    const user = await createUser("MEMBER");
    const expired = await createToken({ email: user.email, type: "EMAIL_VERIFICATION", expiresInMs: -1000 });
    expect((await verifyEmail(expired)).success).toBe(false);
    const token = await createToken({ email: user.email, type: "EMAIL_VERIFICATION" });
    const results = await Promise.all([verifyEmail(token), verifyEmail(token)]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
  });
  it("rolls token deletion back when the account update fails", async () => {
    const token = await createToken({ email: "missing@example.test", type: "EMAIL_VERIFICATION" });
    expect((await verifyEmail(token)).success).toBe(false);
    expect(await prisma.token.findUnique({ where: { tokenHash: hashToken(token) } })).not.toBeNull();
    const reset = await createToken({ email: "missing@example.test", type: "PASSWORD_RESET" });
    expect((await resetPassword(formData({ token: reset, password: "SafePassword123", confirmPassword: "SafePassword123" }))).success).toBe(false);
    expect(await prisma.token.findUnique({ where: { tokenHash: hashToken(reset) } })).not.toBeNull();
  });
  it("password reset commits once and revokes sessions", async () => {
    const user = await createUser("MEMBER");
    const token = await createToken({ email: user.email, type: "PASSWORD_RESET" });
    const reset = () => resetPassword(formData({ token, password: "SafePassword123", confirmPassword: "SafePassword123" }));
    const results = await Promise.all([reset(), reset()]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.tokenVersion).toBe(user.tokenVersion + 1);
    expect(await compare("SafePassword123", updated.passwordHash!)).toBe(true);
  });
  it("account throttling preserves reset tokens and passwords", async () => {
    const user = await createUser("MEMBER");
    const token = await createToken({ email: user.email, type: "PASSWORD_RESET" });
    mocks.limit.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: false });
    expect((await resetPassword(formData({ token, password: "SafePassword123", confirmPassword: "SafePassword123" }))).success).toBe(false);
    expect(mocks.limit).toHaveBeenLastCalledWith("password_change", "127.0.0.1", user.email);
    expect(await prisma.token.findUnique({ where: { tokenHash: hashToken(token) } })).not.toBeNull();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash).toBe(user.passwordHash);
  });
  it("recovery and reset requests apply account limits before delivery", async () => {
    mocks.limit.mockResolvedValue({ success: false });
    expect((await resendVerification(formData({ email: "recovery@example.test" }))).success).toBe(false);
    expect((await requestPasswordReset(formData({ email: "recovery@example.test" }))).success).toBe(false);
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.limit).toHaveBeenCalledWith("verify_resend", "127.0.0.1", "recovery@example.test");
    expect(mocks.limit).toHaveBeenCalledWith("reset_request", "127.0.0.1", "recovery@example.test");
  });
});
