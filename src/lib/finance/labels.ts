/**
 * Finance label maps for all Prisma enums used on the giving/finance pages.
 *
 * These are the single source of truth for display labels.
 * The maps must cover every enum value defined in the Prisma schema.
 */

// ---- Transaction types ----
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  DONATION: "Donation",
  PLEDGE_PAYMENT: "Pledge Payment",
  EXPENSE: "Expense",
};

// ---- Offering categories ----
export const OFFERING_CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  SPECIAL: "Special",
  MISSION: "Mission",
  BUILDING_FUND: "Building Fund",
  WELFARE: "Welfare",
  THANKSGIVING: "Thanksgiving",
  HARVEST: "Harvest",
  FIRST_FRUIT: "First Fruit",
  OTHER: "Other",
};

/**
 * Categories shown to givers on the public /give page.
 * Omits internal-only values.
 */
export const PUBLIC_OFFERING_CATEGORIES = [
  "GENERAL",
  "MISSION",
  "BUILDING_FUND",
  "WELFARE",
  "THANKSGIVING",
  "HARVEST",
  "FIRST_FRUIT",
  "OTHER",
] as const;

/**
 * Display label for an expense's category. Expenses keep the FinancialCategory
 * name in customCategory (their enum category is always GENERAL).
 */
export function expenseCategoryLabel(customCategory: string | null | undefined): string {
  return customCategory?.trim() || "Uncategorized";
}

// ---- Payment methods ----
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  POS: "POS",
  MOBILE_MONEY: "Mobile Money",
  ONLINE: "Online (Paystack)",
};

/**
 * Giving types shown on the public /give page.
 * Excludes PLEDGE_PAYMENT and EXPENSE.
 */
export const PUBLIC_GIVING_TYPES = ["TITHE", "OFFERING", "DONATION"] as const;
