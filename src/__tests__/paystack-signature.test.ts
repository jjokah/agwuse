import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyPaystackSignature } from "@/lib/finance/paystack-signature";

describe("verifyPaystackSignature", () => {
  const secretKey = "test_secret_key_12345";
  const body = JSON.stringify({ event: "charge.success", data: { reference: "AGW_123" } });

  function generateSig(payload: string, secret: string) {
    return crypto.createHmac("sha512", secret).update(payload).digest("hex");
  }

  it("returns true for a valid signature", () => {
    const validSig = generateSig(body, secretKey);
    expect(verifyPaystackSignature(body, validSig, secretKey)).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    const wrongSig = generateSig(body, "wrong_secret");
    expect(verifyPaystackSignature(body, wrongSig, secretKey)).toBe(false);
  });

  it("returns false if signature is missing or malformed", () => {
    expect(verifyPaystackSignature(body, null, secretKey)).toBe(false);
    expect(verifyPaystackSignature(body, "", secretKey)).toBe(false);
    expect(verifyPaystackSignature(body, "too_short", secretKey)).toBe(false);
  });

  it("returns false if body was tampered with", () => {
    const validSig = generateSig(body, secretKey);
    const tamperedBody = body + " ";
    expect(verifyPaystackSignature(tamperedBody, validSig, secretKey)).toBe(false);
  });
});
