import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), compare: vi.fn(),
  authorize: undefined as undefined | ((credentials: Record<string, string>) => Promise<unknown>),
}));
vi.mock("next-auth", () => ({ default: (config: { providers: { authorize: typeof mocks.authorize }[] }) => {
  mocks.authorize = config.providers[0].authorize;
  return { auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), handlers: {} };
} }));
vi.mock("next-auth/providers/credentials", () => ({ default: (config: unknown) => config }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("bcryptjs", () => ({ compare: mocks.compare }));
vi.mock("@/lib/ratelimit", () => ({ checkDualRateLimit: vi.fn(async () => ({ success: true })), getClientIp: vi.fn(async () => "192.0.2.1") }));
vi.mock("@/lib/auth-guards", () => ({ requireAuth: vi.fn(), requireRole: vi.fn(), requirePageRole: vi.fn() }));
import "@/lib/auth";

beforeEach(() => vi.clearAllMocks());
describe("credential lookup during additive profile migrations", () => {
  it("rejects an unknown account normally without selecting unavailable privacy columns", async () => {
    mocks.findUnique.mockImplementation(async ({ select }) => {
      if (!select || select.directoryShowEmail || select.directoryShowPhone) throw new Error("Privacy columns have not been migrated");
      return null;
    });
    expect(await mocks.authorize!({ email: " Unknown@Example.test ", password: "WrongPassword123" })).toBeNull();
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "unknown@example.test" } }));
    expect(mocks.compare).toHaveBeenCalled();
  });
  it("retains the active account's identity and revocation version", async () => {
    mocks.findUnique.mockResolvedValue({ id: "member", email: "member@example.test", passwordHash: "hash", firstName: "Test", lastName: "Member", emailVerified: new Date(), status: "ACTIVE", role: "MEMBER", profilePhoto: null, image: null, tokenVersion: 3 });
    mocks.compare.mockResolvedValue(true);
    expect(await mocks.authorize!({ email: "member@example.test", password: "Password123" })).toMatchObject({ id: "member", name: "Test Member", role: "MEMBER", tokenVersion: 3 });
  });
});
