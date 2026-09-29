import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { CHURCH_TIME_ZONE } from "@/lib/tz";

// Dates are always shown in church (Africa/Lagos) time, regardless of the server's zone.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: CHURCH_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: CHURCH_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// Newer ICU versions put a narrow no-break space (U+202F) before AM/PM.
const NARROW_NBSP = new RegExp(String.fromCharCode(0x202f), "g");

function formatTimeOfDay(d: Date): string {
  return TIME_FORMAT.format(d).replace(NARROW_NBSP, " ");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || !isFinite(num)) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return DATE_FORMAT.format(d); // e.g. "Sep 24, 2026"
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return `${DATE_FORMAT.format(d)} at ${formatTimeOfDay(d)}`; // e.g. "Sep 24, 2026 at 6:00 PM"
}

/** Time of day in church time, e.g. "6:00 PM". */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatTimeOfDay(d);
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatReceiptNumber(year: number, sequence: number): string {
  return `AG-${year}-${String(sequence).padStart(5, "0")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
