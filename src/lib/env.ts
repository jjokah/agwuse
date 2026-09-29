import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Auth.js v5 reads AUTH_SECRET and falls back to NEXTAUTH_SECRET; either is enough.
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("https://agwuse.org"),
  EMAIL_TRANSPORT: z.enum(["resend", "log"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
}).refine((env) => Boolean(env.AUTH_SECRET || env.NEXTAUTH_SECRET), {
  message: "AUTH_SECRET (or legacy NEXTAUTH_SECRET) is required",
  path: ["AUTH_SECRET"],
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  // During build phase without DB or during test, bypass hard exits
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  const isTest = process.env.NODE_ENV === "test";

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    if (process.env.NODE_ENV === "production" && !isBuildPhase && !isTest) {
      throw new Error(`[CRITICAL] Invalid environment variables: ${issues}`);
    } else {
      console.warn(`[WARN] Environment validation issues: ${issues}`);
      return (process.env as unknown) as Env;
    }
  }

  // Production-specific security checks
  if (result.data.NODE_ENV === "production" && !isBuildPhase && !isTest) {
    if (!result.data.RESEND_API_KEY && result.data.EMAIL_TRANSPORT === "resend") {
      console.warn("[WARN] EMAIL_TRANSPORT=resend but RESEND_API_KEY is not set.");
    }
    if (!result.data.PAYSTACK_SECRET_KEY) {
      console.warn("[WARN] PAYSTACK_SECRET_KEY is not set in production.");
    }
  }

  return result.data;
}
