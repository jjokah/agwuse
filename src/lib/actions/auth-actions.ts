"use server";

import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/send-email";
import { AuthError } from "next-auth";

export type AuthActionResult = {
  success: boolean;
  error?: string;
};

export async function registerUser(formData: FormData): Promise<AuthActionResult> {
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

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  // Create user
  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      phone: phone || null,
      role: "MEMBER",
      status: "PENDING",
    },
  });

  // Generate email verification token
  const token = randomBytes(32).toString("hex");
  await prisma.token.create({
    data: {
      email,
      token,
      type: "EMAIL_VERIFICATION",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Send verification email
  await sendVerificationEmail(email, token);

  return { success: true };
}

export async function loginUser(formData: FormData): Promise<AuthActionResult> {
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
        return { success: false, error: "Your account is not active. Please contact the church admin." };
      }
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function verifyEmail(token: string): Promise<AuthActionResult> {
  const tokenRecord = await prisma.token.findUnique({ where: { token } });

  if (!tokenRecord || tokenRecord.type !== "EMAIL_VERIFICATION") {
    return { success: false, error: "Invalid verification token" };
  }

  if (tokenRecord.expires < new Date()) {
    await prisma.token.delete({ where: { token } });
    return { success: false, error: "Verification token has expired. Please register again." };
  }

  // Activate the user
  await prisma.user.update({
    where: { email: tokenRecord.email },
    data: {
      emailVerified: new Date(),
      status: "ACTIVE",
    },
  });

  // Delete used token
  await prisma.token.delete({ where: { token } });

  return { success: true };
}

export async function requestPasswordReset(formData: FormData): Promise<AuthActionResult> {
  const raw = { email: formData.get("email") as string };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email address" };
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true };
  }

  // Delete any existing reset tokens for this email
  await prisma.token.deleteMany({
    where: { email, type: "PASSWORD_RESET" },
  });

  // Generate reset token
  const token = randomBytes(32).toString("hex");
  await prisma.token.create({
    data: {
      email,
      token,
      type: "PASSWORD_RESET",
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetEmail(email, token);

  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<AuthActionResult> {
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

  const tokenRecord = await prisma.token.findUnique({ where: { token } });

  if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
    return { success: false, error: "Invalid reset token" };
  }

  if (tokenRecord.expires < new Date()) {
    await prisma.token.delete({ where: { token } });
    return { success: false, error: "Reset token has expired. Please request a new one." };
  }

  // Update password
  const passwordHash = await hash(password, 12);
  await prisma.user.update({
    where: { email: tokenRecord.email },
    data: { passwordHash },
  });

  // Delete used token
  await prisma.token.delete({ where: { token } });

  return { success: true };
}
