/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { refreshToken, type AuthToken, type DbUserAuthInfo } from "@/lib/auth-token";

describe("refreshToken", () => {
  const baseToken: AuthToken = {
    id: "user-123",
    role: "MEMBER",
    status: "ACTIVE",
    tv: 0,
    chk: 1000,
    name: "John Doe",
  };

  const activeUser: DbUserAuthInfo = {
    role: "MEMBER",
    status: "ACTIVE",
    tokenVersion: 0,
    name: "John Doe",
    image: null,
  };

  it("returns null if token or token.id is missing", async () => {
    const getUser = vi.fn();
    expect(await refreshToken(null, getUser)).toBeNull();
    expect(await refreshToken({} as any, getUser)).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns null if tv is missing (legacy token pre-Phase 2)", async () => {
    const getUser = vi.fn();
    const tokenNoTv: AuthToken = { id: "user-123", role: "MEMBER" };
    expect(await refreshToken(tokenNoTv, getUser)).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns token unchanged if inside revalidation window", async () => {
    const getUser = vi.fn();
    // chk is 1000, now is 1030 (30s later, window is 60s)
    const result = await refreshToken(baseToken, getUser, {
      now: 1030 * 1000,
      revalidateSeconds: 60,
    });
    expect(result).toEqual(baseToken);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("reloads user and updates chk if outside revalidation window and valid", async () => {
    const getUser = vi.fn().mockResolvedValue({
      ...activeUser,
      role: "ADMIN", // role changed in DB!
      name: "John Updated",
    });

    // chk is 1000, now is 1070 (70s later, window is 60s)
    const result = await refreshToken(baseToken, getUser, {
      now: 1070 * 1000,
      revalidateSeconds: 60,
    });

    expect(getUser).toHaveBeenCalledWith("user-123");
    expect(result).toEqual({
      ...baseToken,
      role: "ADMIN",
      name: "John Updated",
      image: null,
      chk: 1070,
    });
  });

  it("returns null if tokenVersion changed in database (revocation)", async () => {
    const getUser = vi.fn().mockResolvedValue({
      ...activeUser,
      tokenVersion: 1, // incremented!
    });

    const result = await refreshToken(baseToken, getUser, {
      now: 1070 * 1000,
      revalidateSeconds: 60,
    });

    expect(getUser).toHaveBeenCalledWith("user-123");
    expect(result).toBeNull();
  });

  it("returns null if user is not ACTIVE in database", async () => {
    const getUser = vi.fn().mockResolvedValue({
      ...activeUser,
      status: "INACTIVE",
    });

    const result = await refreshToken(baseToken, getUser, {
      now: 1070 * 1000,
      revalidateSeconds: 60,
    });

    expect(result).toBeNull();
  });

  it("returns null if user was deleted from database", async () => {
    const getUser = vi.fn().mockResolvedValue(null);

    const result = await refreshToken(baseToken, getUser, {
      now: 1070 * 1000,
      revalidateSeconds: 60,
    });

    expect(result).toBeNull();
  });

  it("forces revalidation even inside window if trigger is 'update'", async () => {
    const getUser = vi.fn().mockResolvedValue({
      ...activeUser,
      name: "Immediate Update",
    });

    // chk is 1000, now is 1010 (only 10s passed, but trigger is update)
    const result = await refreshToken(baseToken, getUser, {
      now: 1010 * 1000,
      revalidateSeconds: 60,
      trigger: "update",
    });

    expect(getUser).toHaveBeenCalledWith("user-123");
    expect(result?.name).toBe("Immediate Update");
    expect(result?.chk).toBe(1010);
  });
});
