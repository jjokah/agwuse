import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/ratelimit";

describe("Rate Limiting", () => {
  it("allows requests under the rate limit", async () => {
    const key = `test-user-${Date.now()}`;
    const first = await checkRateLimit("test_action", key, 3, "60 s", 60_000);
    expect(first.success).toBe(true);

    const second = await checkRateLimit("test_action", key, 3, "60 s", 60_000);
    expect(second.success).toBe(true);
  });

  it("blocks requests exceeding the rate limit", async () => {
    const key = `test-blocked-${Date.now()}`;
    // Limit is 2
    await checkRateLimit("test_block", key, 2, "60 s", 60_000);
    await checkRateLimit("test_block", key, 2, "60 s", 60_000);

    const third = await checkRateLimit("test_block", key, 2, "60 s", 60_000);
    expect(third.success).toBe(false);
    expect(third.error).toContain("Too many attempts");
  });
});
