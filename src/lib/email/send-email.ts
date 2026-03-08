"use server";

import { Resend } from "resend";

const FROM_EMAIL = "AG Wuse <noreply@agwuse.org>";

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  // If no API key configured, log to console in development
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification email for ${email}: ${verifyUrl}`);
    return { success: true };
  }

  const { error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your email - AG Wuse",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Welcome to AG Wuse!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #D4A017; color: #1a1a2e; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Verify Email
        </a>
        <p style="margin-top: 16px; color: #666;">Or copy this link: ${verifyUrl}</p>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">This link expires in 24 hours.</p>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Assemblies of God Church, Wuse Zone 5, Abuja</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Password reset email for ${email}: ${resetUrl}`);
    return { success: true };
  }

  const { error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password - AG Wuse",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Password Reset</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #D4A017; color: #1a1a2e; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
        <p style="margin-top: 16px; color: #666;">Or copy this link: ${resetUrl}</p>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Assemblies of God Church, Wuse Zone 5, Abuja</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
