import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";
import { getAbsoluteUrl } from "@/lib/site";
import { VerifyEmail } from "@/emails/verify";
import { ResetEmail } from "@/emails/reset";
import { ApprovedEmail } from "@/emails/approved";
import { GiftReceiptEmail } from "@/emails/gift-receipt";
import { NewRegistrationEmail } from "@/emails/new-registration";
import { NewSubmissionEmail } from "@/emails/new-submission";
import { RegistrationAttemptEmail } from "@/emails/registration-attempt";

export type EmailTransport = "resend" | "log";

export type SendEmailOptions = {
  to: string | string[] | readonly string[];
  subject: string;
  react: ReactElement;
  idempotencyKey?: string;
};

export type SendEmailResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getTransport(): EmailTransport {
  const envTransport = process.env.EMAIL_TRANSPORT?.toLowerCase();
  if (envTransport === "resend" || envTransport === "log") {
    return envTransport;
  }
  return process.env.RESEND_API_KEY ? "resend" : "log";
}

function getFromEmail(): string {
  return process.env.EMAIL_FROM || "AG Wuse <info@agwuse.org>";
}

export async function sendEmail({
  to,
  subject,
  react,
  idempotencyKey,
}: SendEmailOptions): Promise<SendEmailResult> {
  const transport = getTransport();
  const recipients: string[] = Array.isArray(to) ? [...to] : [to as string];

  if (recipients.length === 0) {
    return { success: false, error: "No recipients specified" };
  }

  const isProd = process.env.NODE_ENV === "production";

  if (transport === "log") {
    console.log(
      `[EMAIL LOG] To: ${recipients.join(", ")} | Subject: "${subject}" | Idempotency: ${idempotencyKey || "none"}`
    );
    return { success: true };
  }

  // Transport is resend
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const msg = "RESEND_API_KEY is not configured";
    if (isProd) {
      console.error(`[FATAL] ${msg} in production email sending.`);
      return { success: false, error: msg };
    }
    console.warn(`[DEV WARNING] ${msg}, falling back to log`);
    return { success: true };
  }

  const from = getFromEmail();
  if (isProd && (!process.env.EMAIL_FROM || process.env.EMAIL_FROM.includes("magnisale.com"))) {
    console.warn(`[EMAIL WARNING] Using unverified or default EMAIL_FROM in production: ${from}`);
  }

  try {
    const resend = new Resend(apiKey);
    const options: Parameters<typeof resend.emails.send>[0] = {
      from,
      to: recipients,
      subject,
      react,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    };

    const { data, error } = await resend.emails.send(options);

    if (error) {
      console.error("Resend send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("sendEmail unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

// ============================================================
// CONVENIENCE EMAIL TRIGGERS
// ============================================================

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<SendEmailResult> {
  const verifyUrl = getAbsoluteUrl(`/verify-email?token=${token}`);
  return sendEmail({
    to: email,
    subject: "Verify your email - AG Wuse",
    react: VerifyEmail({ verifyUrl }),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<SendEmailResult> {
  const resetUrl = getAbsoluteUrl(`/reset-password?token=${token}`);
  return sendEmail({
    to: email,
    subject: "Reset your password - AG Wuse",
    react: ResetEmail({ resetUrl }),
  });
}

export async function sendAccountApprovedEmail(
  email: string,
  name: string
): Promise<SendEmailResult> {
  const loginUrl = getAbsoluteUrl("/login");
  return sendEmail({
    to: email,
    subject: "Your AG Wuse account has been approved!",
    react: ApprovedEmail({ name, loginUrl }),
  });
}

export async function sendGiftReceiptEmail(
  email: string,
  data: {
    receiptNumber: string;
    amount: string;
    date: string;
    type: string;
    category?: string | null;
    memberName?: string | null;
    idempotencyKey?: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to: email,
    subject: `Donation Receipt ${data.receiptNumber} - AG Wuse`,
    react: GiftReceiptEmail(data),
    idempotencyKey: data.idempotencyKey || `receipt-${data.receiptNumber}`,
  });
}

export async function sendNewRegistrationEmail(
  recipients: string[] | readonly string[],
  data: {
    name: string;
    email: string;
    phone?: string | null;
    registeredAt?: string;
  }
): Promise<SendEmailResult> {
  if (recipients.length === 0) return { success: true };
  return sendEmail({
    to: recipients,
    subject: `New Member Registration: ${data.name} - AG Wuse`,
    react: NewRegistrationEmail({
      ...data,
      registeredAt: data.registeredAt || new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
    }),
  });
}

export async function sendNewSubmissionEmail(
  recipients: string[] | readonly string[],
  data: {
    type: string;
    name?: string | null;
    email?: string | null;
    content: string;
    isPublic: boolean;
  }
): Promise<SendEmailResult> {
  if (recipients.length === 0) return { success: true };
  const label = data.type === "PRAYER_REQUEST" ? "Prayer Request" : "Testimony";
  return sendEmail({
    to: recipients,
    subject: `New ${label} Submitted - AG Wuse`,
    react: NewSubmissionEmail(data),
  });
}

export async function sendRegistrationAttemptEmail(
  email: string,
  resetToken: string
): Promise<SendEmailResult> {
  const resetUrl = getAbsoluteUrl(`/reset-password?token=${resetToken}`);
  return sendEmail({
    to: email,
    subject: "Security Alert: Registration attempt on your AG Wuse account",
    react: RegistrationAttemptEmail({ resetUrl }),
  });
}
