import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type TokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

/**
 * Computes SHA-256 hash of a raw token string.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface CreateTokenOptions {
  email: string;
  type: TokenType;
  expiresInMs?: number;
}

/**
 * Generates a secure random token, persists its SHA-256 hash in the database,
 * and clears any older tokens of the same type for this email.
 * Returns the unhashed raw token to be sent to the user.
 */
export async function createToken(options: CreateTokenOptions): Promise<string> {
  const normalizedEmail = normalizeEmail(options.email);
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const defaultTtl =
    options.type === "EMAIL_VERIFICATION"
      ? 24 * 60 * 60 * 1000 // 24 hours
      : 60 * 60 * 1000; // 1 hour

  const expires = new Date(Date.now() + (options.expiresInMs ?? defaultTtl));

  await prisma.$transaction(async (tx) => {
    await tx.token.deleteMany({
      where: {
        email: normalizedEmail,
        type: options.type,
      },
    });

    await tx.token.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        type: options.type,
        expires,
      },
    });
  });

  return rawToken;
}

/**
 * Atomically consumes a token by verifying its hash and expiration.
 * Because the row is deleted in the same atomic operation, a token can only
 * be used once, preventing race conditions or replay attacks.
 */
export async function consumeToken(
  rawToken: string,
  type: TokenType,
): Promise<{ email: string; type: string } | null> {
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);

  const rows = await prisma.$queryRaw<Array<{ email: string; type: string }>>`
    DELETE FROM "tokens"
    WHERE "tokenHash" = ${tokenHash}
      AND "type" = ${type}
      AND "expires" > NOW()
    RETURNING "email", "type";
  `;

  if (!rows || rows.length === 0) {
    return null;
  }

  return rows[0];
}
