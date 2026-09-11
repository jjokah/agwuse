import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import crypto from "crypto";

// In-memory fallback map for environments without Upstash Redis configured
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (memoryStore.size > 2000) {
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
let hasLoggedUpstashWarning = false;

function getRedisClient(): Redis | null {
  if (clientInitialized) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redisClient = new Redis({ url, token });
  } else if (process.env.NODE_ENV === "production" && !hasLoggedUpstashWarning) {
    hasLoggedUpstashWarning = true;
    console.error(
      "WARNING: Upstash Redis is not configured in production. In-memory rate limiting will not persist across serverless instances.",
    );
  }
  clientInitialized = true;
  return redisClient;
}

const ratelimitCache = new Map<string, Ratelimit>();

function getCachedRatelimit(
  redis: Redis,
  limit: number,
  windowDuration: "10 s" | "60 s" | "15 m" | "1 h",
): Ratelimit {
  const cacheKey = `${limit}:${windowDuration}`;
  let limiter = ratelimitCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, windowDuration),
      analytics: false,
      prefix: "agwuse:ratelimit",
    });
    ratelimitCache.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Extracts connecting client IP.
 * Prefers x-real-ip (standard on Vercel); otherwise evaluates X-Forwarded-For
 * from the right using TRUSTED_PROXY_HOPS.
 */
export function extractClientIp(headerGetter: { get(name: string): string | null }): string {
  const realIp = headerGetter.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headerGetter.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const hops = parseInt(
      (typeof process !== "undefined" && process.env.TRUSTED_PROXY_HOPS) || "1",
      10,
    );
    const targetIdx = Math.max(0, parts.length - hops);
    if (parts[targetIdx]) return parts[targetIdx];
  }

  return "127.0.0.1";
}

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return extractClientIp(headerList);
  } catch {
    return "127.0.0.1";
  }
}

export type RateLimitAction = "login" | "reset_request" | "verify_resend";

export interface DualRateLimitConfig {
  ipLimit: number;
  ipWindow: "60 s" | "15 m" | "1 h";
  ipWindowMs: number;
  emailLimit: number;
  emailWindow: "60 s" | "15 m" | "1 h";
  emailWindowMs: number;
}

export const RATE_LIMIT_CONFIGS: Record<RateLimitAction, DualRateLimitConfig> = {
  login: {
    ipLimit: 10,
    ipWindow: "60 s",
    ipWindowMs: 60_000,
    emailLimit: 5,
    emailWindow: "15 m",
    emailWindowMs: 15 * 60_000,
  },
  reset_request: {
    ipLimit: 3,
    ipWindow: "60 s",
    ipWindowMs: 60_000,
    emailLimit: 3,
    emailWindow: "1 h",
    emailWindowMs: 60 * 60_000,
  },
  verify_resend: {
    ipLimit: 10,
    ipWindow: "60 s",
    ipWindowMs: 60_000,
    emailLimit: 3,
    emailWindow: "1 h",
    emailWindowMs: 60 * 60_000,
  },
};

/**
 * Checks rate limits applying IP and email-hash keys together.
 */
export async function checkDualRateLimit(
  action: RateLimitAction,
  ip: string,
  email?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const cfg = RATE_LIMIT_CONFIGS[action];

  // 1. Check IP limit
  const ipCheck = await checkRateLimit(
    `${action}:ip`,
    ip,
    cfg.ipLimit,
    cfg.ipWindow,
    cfg.ipWindowMs,
  );
  if (!ipCheck.success) {
    return ipCheck;
  }

  // 2. Check Email limit if email is supplied
  if (email) {
    const emailHash = crypto
      .createHash("sha256")
      .update(email.trim().toLowerCase())
      .digest("hex")
      .slice(0, 16);

    const emailCheck = await checkRateLimit(
      `${action}:email`,
      emailHash,
      cfg.emailLimit,
      cfg.emailWindow,
      cfg.emailWindowMs,
    );
    if (!emailCheck.success) {
      return {
        success: false,
        error: "Too many attempts for this account. Please wait and try again later.",
      };
    }
  }

  return { success: true };
}

/**
 * Checks rate limit for a given action and key.
 */
export async function checkRateLimit(
  actionName: string,
  identifier: string,
  limit: number = 5,
  windowDuration: "10 s" | "60 s" | "15 m" | "1 h" = "60 s",
  windowMs: number = 60_000,
): Promise<{ success: boolean; error?: string }> {
  const fullKey = `${actionName}:${identifier}`;

  try {
    const redis = getRedisClient();
    if (redis) {
      const ratelimit = getCachedRatelimit(redis, limit, windowDuration);
      const result = await ratelimit.limit(fullKey);
      if (!result.success) {
        return {
          success: false,
          error: "Too many attempts. Please wait a moment and try again.",
        };
      }
      return { success: true };
    }

    // In-memory fallback
    const memResult = inMemoryRateLimit(fullKey, limit, windowMs);
    if (!memResult.success) {
      return {
        success: false,
        error: "Too many attempts. Please wait a moment and try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Rate limiting check failed (failing open):", err);
    return { success: true };
  }
}
