type EmailConfiguration = {
  [key: string]: string | undefined;
  EMAIL_TRANSPORT?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
};

/** Email outages must fail delivery explicitly without preventing unrelated pages from starting. */
export function productionEmailConfigurationError(env: EmailConfiguration): string | undefined {
  if (env.EMAIL_TRANSPORT?.toLowerCase() === "log") {
    return "Logging email transport is disabled in production";
  }
  if (!env.RESEND_API_KEY?.startsWith("re_")) {
    return "A valid RESEND_API_KEY is required for production email delivery";
  }
  if (!env.EMAIL_FROM || !/@[^\s<>]+\.[^\s<>]+/.test(env.EMAIL_FROM)) {
    return "A valid EMAIL_FROM is required for production email delivery";
  }
}
