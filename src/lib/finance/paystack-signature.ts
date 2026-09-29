import crypto from "crypto";

/**
 * Validates a Paystack webhook signature using HMAC-SHA512.
 * Uses timingSafeEqual to guard against timing attacks.
 */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null | undefined,
  secretKey: string,
): boolean {
  if (!signature || !secretKey || !rawBody) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  const hashBuffer = Buffer.from(hash, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");

  if (hashBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
}
