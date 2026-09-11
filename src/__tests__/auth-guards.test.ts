/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireRole, requirePageRole } from "@/lib/auth-guards";
import * as authModule from "@/lib/auth";
import * as authStateModule from "@/lib/auth-state";
import * as navigationModule from "next/navigation";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth-state", () => ({
  getAuthState: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("auth-guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDbUser = {
    id: "user-1",
    email: "user@example.com",
    name: "Jane Doe",
    image: "/avatar.png",
    profilePhoto: "/avatar.png",
    role: "MEMBER",
    status: "ACTIVE",
    tokenVersion: 2,
  };

  describe("requireAuth", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null as any);
      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("throws Unauthorized when user is not ACTIVE in DB", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user-1", role: "MEMBER", status: "ACTIVE", tokenVersion: 2 },
      } as any);
      vi.mocked(authStateModule.getAuthState).mockResolvedValue({
        ...mockDbUser,
        status: "INACTIVE",
      });

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("throws Unauthorized when tokenVersion in DB mismatches session", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user-1", role: "MEMBER", status: "ACTIVE", tokenVersion: 2 },
      } as any);
      vi.mocked(authStateModule.getAuthState).mockResolvedValue({
        ...mockDbUser,
        tokenVersion: 3, // revoked!
      });

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("succeeds and returns session when user is ACTIVE and tokenVersion matches", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user-1", role: "MEMBER", status: "ACTIVE", tokenVersion: 2 },
      } as any);
      vi.mocked(authStateModule.getAuthState).mockResolvedValue(mockDbUser);

      const result = await requireAuth();
      expect(result.user.id).toBe("user-1");
      expect(result.user.role).toBe("MEMBER");
      expect(result.user.status).toBe("ACTIVE");
      expect(result.user.tokenVersion).toBe(2);
    });
  });

  describe("requireRole", () => {
    it("succeeds when role is allowed", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user-1", role: "ADMIN", status: "ACTIVE", tokenVersion: 2 },
      } as any);
      vi.mocked(authStateModule.getAuthState).mockResolvedValue({
        ...mockDbUser,
        role: "ADMIN",
      });

      const result = await requireRole(["ADMIN", "SUPER_ADMIN"]);
      expect(result.user.role).toBe("ADMIN");
    });

    it("throws Forbidden when role is not allowed", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user-1", role: "MEMBER", status: "ACTIVE", tokenVersion: 2 },
      } as any);
      vi.mocked(authStateModule.getAuthState).mockResolvedValue(mockDbUser);

      await expect(requireRole(["ADMIN", "SUPER_ADMIN"])).rejects.toThrow("Forbidden");
    });
  });

  describe("requirePageRole", () => {
    it("redirects to login when unauthenticated", async () => {
      vi.mocked(authModule.auth).mockResolvedValue(null as any);
      await requirePageRole(["ADMIN"]);
      expect(navigationModule.redirect).toHaveBeenCalledWith("/login");
    });

    it("redirects to dashboard when role is not allowed", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user-1", role: "MEMBER", status: "ACTIVE", tokenVersion: 2 },
      } as any);
      vi.mocked(authStateModule.getAuthState).mockResolvedValue(mockDbUser);

      await requirePageRole(["ADMIN"]);
      expect(navigationModule.redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("returns session when role is allowed", async () => {
      vi.mocked(authModule.auth).mockResolvedValue({
        user: { id: "user-1", role: "ADMIN", status: "ACTIVE", tokenVersion: 2 },
      } as any);
      vi.mocked(authStateModule.getAuthState).mockResolvedValue({
        ...mockDbUser,
        role: "ADMIN",
      });

      const result = await requirePageRole(["ADMIN"]);
      expect(navigationModule.redirect).not.toHaveBeenCalled();
      expect(result.user.role).toBe("ADMIN");
    });
  });
});
