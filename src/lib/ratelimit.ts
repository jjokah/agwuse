import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// In-memory fallback map for environments without Upstash Redis configured
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memoryStore.get(key);

  // Periodically clean up expired entries if store gets large
  if (memoryStore.size > 1000) {
    for (const [k, v] of memoryStore.entries()) {
      if (now > v.resetAt) memoryStore.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false };
  }

  entry.count += 1;
  return { success: true };
}

let redisClient: Redis | null = null;
let clientInitialized = false;

function getRedisClient(): Redis | null {
  if (clientInitialized) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redisClient = new Redis({ url, token });
  }
  clientInitialized = true;
  return redisClient;
}

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    return headerList.get("x-real-ip") || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Checks rate limit for a given action and key.
 *
 * Defaults:
 * - limit: 5 attempts
 * - windowDuration: "60 s" (1 minute)
 */
export async function checkRateLimit(
  actionName: string,
  identifier: string,
  limit: number = 5,
  windowDuration: "10 s" | "60 s" | "15 m" | "1 h" = "60 s",
  windowMs: number = 60_000
): Promise<{ success: boolean; error?: string }> {
  const fullKey = `${actionName}:${identifier}`;

  try {
    const redis = getRedisClient();
    if (redis) {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, windowDuration),
        analytics: false,
        prefix: "agwuse:ratelimit",
      });
      const result = await ratelimit.limit(fullKey);
      if (!result.success) {
        return {
          success: false,
          error: "Too many attempts. Please wait a minute and try again.",
        };
      }
      return { success: true };
    }

    // In-memory sliding window fallback
    const memResult = inMemoryRateLimit(fullKey, limit, windowMs);
    if (!memResult.success) {
      return {
        success: false,
        error: "Too many attempts. Please wait a minute and try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Rate limiting check failed (failing open):", err);
    return { success: true };
  }
}
