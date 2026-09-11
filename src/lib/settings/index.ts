import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { withBuildFallback } from "@/lib/build-fallback";
import {
  churchSettingsDefaults,
  churchSettingsKeySchema,
  parseStoredValue,
  type ChurchInfo,
} from "./schema";

export { type ChurchInfo } from "./schema";
export { updateChurchSettingsAction as updateChurchSettings } from "@/lib/actions/settings-actions";

function formatChurchInfo(rawValues: Record<string, unknown>): ChurchInfo {
  const values = { ...churchSettingsDefaults, ...rawValues };

  const name = String(values.church_name || churchSettingsDefaults.church_name);
  const shortName = String(values.church_short_name || churchSettingsDefaults.church_short_name);
  const tagline = String(values.church_tagline || churchSettingsDefaults.church_tagline);
  const address = String(values.church_address || churchSettingsDefaults.church_address);
  const phones = Array.isArray(values.church_phones)
    ? (values.church_phones as string[])
    : churchSettingsDefaults.church_phones;
  const email = String(values.church_email || churchSettingsDefaults.church_email);
  const bankName = String(values.bank_name || churchSettingsDefaults.bank_name);
  const bankAccount = String(values.bank_account || churchSettingsDefaults.bank_account);
  const serviceTimes = Array.isArray(values.service_times)
    ? (values.service_times as string[])
    : churchSettingsDefaults.service_times;
  const notificationEmails = Array.isArray(values.notification_emails)
    ? (values.notification_emails as string[])
    : churchSettingsDefaults.notification_emails;

  return {
    name,
    shortName,
    tagline,
    address,
    phones,
    email,
    bankName,
    bankAccount,
    serviceTimes,
    notificationEmails,
    church_name: name,
    church_short_name: shortName,
    church_tagline: tagline,
    church_address: address,
    church_phones: phones,
    church_email: email,
    bank_name: bankName,
    bank_account: bankAccount,
    service_times: serviceTimes,
    notification_emails: notificationEmails,
    website: "https://agwuse.org",
    aka: "Assemblies of God International Gospel Centre, Wuse-Abuja",
    facebook: [
      "AG Wuse Abuja",
      "AGC International Gospel Centre Wuse-Abuja",
    ],
  };
}

export const getChurchInfo = cache(async (): Promise<ChurchInfo> => {
  return withBuildFallback(
    async () => {
      const rows = await prisma.churchSettings.findMany();
      const rawMap: Record<string, unknown> = {};

      for (const row of rows) {
        const keyParsed = churchSettingsKeySchema.safeParse(row.key);
        if (keyParsed.success) {
          rawMap[keyParsed.data] = parseStoredValue(keyParsed.data, row.value);
        }
      }

      return formatChurchInfo(rawMap);
    },
    formatChurchInfo({})
  );
});
