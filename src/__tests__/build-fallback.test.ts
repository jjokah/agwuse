import { describe, it, expect, afterEach } from "vitest";
import { withBuildFallback } from "@/lib/build-fallback";

describe("withBuildFallback", () => {
  const originalEnv = process.env.NEXT_PHASE;

  afterEach(() => {
    process.env.NEXT_PHASE = originalEnv;
  });

  it("returns function result on success regardless of phase", async () => {
    const result = await withBuildFallback(async () => [1, 2, 3], []);
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns fallback value when error occurs during build phase", async () => {
    process.env.NEXT_PHASE = "phase-production-build";
    const result = await withBuildFallback(async () => {
      throw new Error("DB offline");
    }, []);
    expect(result).toEqual([]);
  });

  it("rethrows error when error occurs at runtime", async () => {
    delete process.env.NEXT_PHASE;
    await expect(
      withBuildFallback(async () => {
        throw new Error("DB offline");
      }, []),
    ).rejects.toThrow("DB offline");
  });
});
