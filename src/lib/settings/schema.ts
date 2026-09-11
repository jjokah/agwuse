import { z } from "zod";
import { CHURCH_INFO, WEEKLY_ACTIVITIES } from "@/lib/constants";

export const defaultServiceTimes = WEEKLY_ACTIVITIES.map(
  (a) => `${a.day} ${a.time}: ${a.activity}`
);

export const churchSettingsDefaults = {
  church_name: CHURCH_INFO.name,
  church_short_name: CHURCH_INFO.shortName,
  church_tagline: CHURCH_INFO.tagline,
  church_address: CHURCH_INFO.address,
  church_phones: [...CHURCH_INFO.phones],
  church_email: CHURCH_INFO.email,
  bank_name: CHURCH_INFO.bankName,
  bank_account: CHURCH_INFO.bankAccount,
  service_times: defaultServiceTimes,
  notification_emails: [CHURCH_INFO.email],
};

export type ChurchSettingsValues = typeof churchSettingsDefaults;

export type ChurchInfo = {
  name: string;
  shortName: string;
  tagline: string;
  address: string;
  phones: readonly string[];
  email: string;
  bankName: string;
  bankAccount: string;
  serviceTimes: readonly string[];
  notificationEmails: readonly string[];
  // Snake case aliases matching schema keys
  church_name: string;
  church_short_name: string;
  church_tagline: string;
  church_address: string;
  church_phones: readonly string[];
  church_email: string;
  bank_name: string;
  bank_account: string;
  service_times: readonly string[];
  notification_emails: readonly string[];
  // Backwards compatibility with CHURCH_INFO
  website: string;
  aka: string;
  facebook: readonly string[];
};

export const churchSettingsKeySchema = z.enum([
  "church_name",
  "church_short_name",
  "church_tagline",
  "church_address",
  "church_phones",
  "church_email",
  "bank_name",
  "bank_account",
  "service_times",
  "notification_emails",
]);

export type ChurchSettingsKey = z.infer<typeof churchSettingsKeySchema>;

export const churchSettingsSchema = z.object({
  church_name: z.string().min(2, "Church name is required"),
  church_short_name: z.string().min(2, "Short name is required"),
  church_tagline: z.string().min(2, "Tagline is required"),
  church_address: z.string().min(5, "Address is required"),
  church_phones: z
    .array(z.string().min(5, "Invalid phone number"))
    .min(1, "At least one phone number is required"),
  church_email: z.string().email("Invalid church email address"),
  bank_name: z.string().min(2, "Bank name is required"),
  bank_account: z.string().min(5, "Bank account number is required"),
  service_times: z
    .array(z.string().min(2))
    .min(1, "At least one service time is required"),
  notification_emails: z
    .array(z.string().email("Invalid notification email"))
    .min(1, "At least one notification email is required"),
});

export function parseStoredValue(key: ChurchSettingsKey, raw: string): unknown {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return parsed;
  } catch {
    // Legacy plain string fallback
    switch (key) {
      case "church_phones":
      case "service_times":
      case "notification_emails": {
        // May be comma or newline separated, or a single raw string
        const parts = trimmed
          .split(/[\n,]+/)
          .map((p) => p.trim())
          .filter(Boolean);
        return parts.length > 0 ? parts : [trimmed];
      }
      default:
        return trimmed;
    }
  }
}
