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
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { revokeSessions } from "@/lib/authz/revoke";
import { createToken, consumeToken, normalizeEmail } from "@/lib/tokens";
import { AuthError } from "next-auth";

export type AuthActionResult = {
  success: boolean;
  error?: string;
};

export async function registerUser(formData: FormData): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("auth_register", ip, 5, "60 s");
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
    // Check if user already exists — return success to prevent email enumeration,
    // but alert the existing account holder asynchronously.
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      const resetToken = await createToken({
        email: normalized,
        type: "PASSWORD_RESET",
      });

      const notifyExisting = async () => {
        try {
          await sendRegistrationAttemptEmail(normalized, resetToken);
        } catch (err) {
          console.error("Non-blocking registration attempt email failed:", err);
        }
      };

      if (typeof after === "function") {
        after(notifyExisting);
      } else {
        void notifyExisting();
      }

      return { success: true };
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
      return { success: false, error: "Failed to send verification email. Please try again." };
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
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("auth_resend_verify", ip, 5, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const rawEmail = formData.get("email") as string;
  if (!rawEmail) return { success: true };

  const email = normalizeEmail(rawEmail);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      const token = await createToken({
        email,
        type: "EMAIL_VERIFICATION",
      });

      const resendTask = async () => {
        try {
          await sendVerificationEmail(email, token);
        } catch (err) {
          console.error("Failed to resend verification email:", err);
        }
      };

      if (typeof after === "function") {
        after(resendTask);
      } else {
        void resendTask();
      }
    }
    return { success: true };
  } catch (err) {
    console.error("resendVerification error:", err);
    return { success: true }; // Non-enumerating
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

  const consumed = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!consumed) {
    return { success: false, error: "Invalid or expired verification token" };
  }

  // Set emailVerified only — status stays PENDING until admin approves
  await prisma.user.update({
    where: { email: consumed.email },
    data: {
      emailVerified: new Date(),
    },
  });

  return { success: true };
}

export async function requestPasswordReset(formData: FormData): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const limitCheck = await checkRateLimit("auth_password_reset_req", ip, 3, "60 s");
  if (!limitCheck.success) {
    return { success: false, error: limitCheck.error };
  }

  const raw = { email: formData.get("email") as string };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email address" };
  }

  const normalized = normalizeEmail(parsed.data.email);

  try {
    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      return { success: true };
    }

    const token = await createToken({
      email: normalized,
      type: "PASSWORD_RESET",
    });

    const sendResetTask = async () => {
      try {
        await sendPasswordResetEmail(normalized, token);
      } catch (err) {
        console.error("Non-blocking password reset email error:", err);
      }
    };

    if (typeof after === "function") {
      after(sendResetTask);
    } else {
      void sendResetTask();
    }

    return { success: true };
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return { success: true }; // Don't leak details on reset
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
    const consumed = await consumeToken(token, "PASSWORD_RESET");
    if (!consumed) {
      return { success: false, error: "Invalid or expired reset token. Please request a new one." };
    }

    // Update password and revoke existing sessions in transaction
    const passwordHash = await hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { email: consumed.email },
        data: { passwordHash },
      });
      await revokeSessions(tx, updatedUser.id);
    });

    return { success: true };
  } catch (err) {
    console.error("resetPassword error:", err);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}
