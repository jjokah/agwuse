"use server";

import { hash } from "bcryptjs";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNewRegistrationEmail,
  sendRegistrationAttemptEmail,
} from "@/lib/email/send";
import { getChurchInfo } from "@/lib/settings";
import { checkRateLimit, checkDualRateLimit, getClientIp } from "@/lib/ratelimit";
import { revokeSessions } from "@/lib/authz/revoke";
import { createToken, consumeToken, hashToken, normalizeEmail } from "@/lib/tokens";
import { AuthError } from "next-auth";

export type AuthActionResult = {
  success: boolean;
  error?: string;
};

export async function registerUser(formData: FormData): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const limitCheck = await checkDualRateLimit("register", ip, String(formData.get("email") ?? ""));
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  const normalized = normalizeEmail(email);

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      const result = existing.emailVerified
        ? await sendRegistrationAttemptEmail(normalized)
        : await sendVerificationEmail(normalized, await createToken({ email: normalized, type: "EMAIL_VERIFICATION" }));
      return result.success ? { success: true } : { success: false, error: "Email delivery failed. Please use resend verification to try again." };
    }

    // Create user
    const passwordHash = await hash(password, 12);
    await prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        role: "MEMBER",
        status: "PENDING",
      },
    });

    // Generate hashed email verification token
    const token = await createToken({
      email: normalized,
      type: "EMAIL_VERIFICATION",
    });

    // Send verification email to registrant
    const emailResult = await sendVerificationEmail(normalized, token);
    if (!emailResult.success) {
      return { success: false, error: "Email delivery failed. Please use resend verification to try again." };
    }

    // Notify administrators asynchronously via after()
    const notifyAdmins = async () => {
      try {
        const churchInfo = await getChurchInfo();
        if (churchInfo.notificationEmails.length > 0) {
          await sendNewRegistrationEmail(churchInfo.notificationEmails, {
            name: `${firstName} ${lastName}`,
            email: normalized,
            phone: phone || null,
          });
        }
      } catch (adminErr) {
        console.error("Non-blocking admin registration email error:", adminErr);
      }
    };

    if (typeof after === "function") {
      after(notifyAdmins);
    } else {
      void notifyAdmins();
    }

    return { success: true };
  } catch (err) {
    console.error("registerUser error:", err);
    return { success: false, error: "An unexpected error occurred during registration. Please try again." };
  }
}

export async function resendVerification(formData: FormData): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: false, error: "Please enter a valid email address" };
  const email = normalizeEmail(parsed.data.email);
  const limit = await checkDualRateLimit("verify_resend", await getClientIp(), email);
  if (!limit.success) return limit;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Every valid address receives guidance, keeping the result non-enumerating.
    const result = user && !user.emailVerified
      ? await sendVerificationEmail(email, await createToken({ email, type: "EMAIL_VERIFICATION" }))
      : await sendRegistrationAttemptEmail(email);
    return result.success ? { success: true } : { success: false, error: "Email delivery failed. Please try again later." };
  } catch (err) {
    console.error("resendVerification error:", err);
    return { success: false, error: "Email delivery failed. Please try again later." };
  }
}

export async function loginUser(formData: FormData): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("auth_login", ip, 5, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  try {
    await signIn("credentials", {
      email: raw.email,
      password: raw.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.cause?.err?.message === "EMAIL_NOT_VERIFIED") {
        return { success: false, error: "Please verify your email before logging in. Check your inbox." };
      }
      if (error.cause?.err?.message === "RATE_LIMITED") {
        return { success: false, error: "Too many sign-in attempts. Please wait a few minutes and try again." };
      }
      if (error.cause?.err?.message === "ACCOUNT_NOT_ACTIVE") {
        return { success: false, error: "Your account is awaiting approval by a church administrator." };
      }
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function verifyEmail(token: string): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("auth_verify", ip, 10, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const consumed = await consumeToken(token, "EMAIL_VERIFICATION", tx);
      if (!consumed) return { success: false, error: "Invalid or expired verification token" };
      await tx.user.update({ where: { email: consumed.email }, data: { emailVerified: new Date() } });
      return { success: true };
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    return { success: false, error: "Verification could not be completed. Please try again." };
  }
}

export async function requestPasswordReset(formData: FormData): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { success: false, error: "Please enter a valid email address" };
  const email = normalizeEmail(parsed.data.email);
  const limit = await checkDualRateLimit("reset_request", await getClientIp(), email);
  if (!limit.success) return limit;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const result = user
      ? await sendPasswordResetEmail(email, await createToken({ email, type: "PASSWORD_RESET" }))
      : await sendRegistrationAttemptEmail(email);
    return result.success ? { success: true } : { success: false, error: "Email delivery failed. Please try again later." };
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return { success: false, error: "Email delivery failed. Please try again later." };
  }
}

export async function resetPassword(formData: FormData): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("auth_password_reset", ip, 5, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError.message };
  }

  const { token, password } = parsed.data;

  try {
    // Limit the account before hashing; keep network calls outside the database transaction.
    const pending = await prisma.token.findUnique({ where: { tokenHash: hashToken(token) }, select: { email: true } });
    if (!pending) return { success: false, error: "Invalid or expired reset token. Please request a new one." };
    const limit = await checkDualRateLimit("password_change", ip, pending.email);
    if (!limit.success) return limit;
    const passwordHash = await hash(password, 12);
    return await prisma.$transaction(async (tx) => {
      const consumed = await consumeToken(token, "PASSWORD_RESET", tx);
      if (!consumed) return { success: false, error: "Invalid or expired reset token. Please request a new one." };
      const user = await tx.user.update({ where: { email: consumed.email }, data: { passwordHash } });
      await revokeSessions(tx, user.id);
      return { success: true };
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}
