import { z } from "zod/v4";
import { isCalendarDay } from "@/lib/calendar";

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, { error: "First name is required" }).max(100),
  lastName: z.string().trim().min(2, { error: "Last name is required" }).max(100),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  occupation: z.string().max(100).optional(),
  dateOfBirth: z.string().refine((v) => !v || isCalendarDay(v), { error: "Invalid date of birth" }).optional(),
  gender: z.enum(["MALE", "FEMALE", "none", ""]).optional().transform((v) => !v || v === "none" ? null : v),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "DIVORCED", "none", ""]).optional().transform((v) => !v || v === "none" ? null : v),
  directoryShowEmail: z.boolean().optional().default(false),
  directoryShowPhone: z.boolean().optional().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { error: "Password must contain an uppercase letter" })
      .regex(/[a-z]/, { error: "Password must contain a lowercase letter" })
      .regex(/[0-9]/, { error: "Password must contain a number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

const optionalDateOnly = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!isCalendarDay(v)) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return new Date(v); // stored as UTC midnight of the chosen day
  });

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

/** Admin edit of a member profile (FormData from the admin user edit form). */
export const adminUpdateUserSchema = z.object({
  firstName: z.string().trim().min(2, { error: "First name is required" }).max(100),
  lastName: z.string().trim().min(2, { error: "Last name is required" }).max(100),
  phone: optionalTrimmed(30),
  address: optionalTrimmed(500),
  occupation: optionalTrimmed(100),
  // "none" = the form's "Not specified" option
  gender: z
    .enum(["MALE", "FEMALE", "none", ""])
    .optional()
    .transform((v) => (v === "MALE" || v === "FEMALE" ? v : null)),
  maritalStatus: z
    .enum(["SINGLE", "MARRIED", "WIDOWED", "DIVORCED", "none", ""])
    .optional()
    .transform((v) => (!v || v === "none" ? null : v)),
  departmentId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (!v || v === "none" ? null : v)),
  dateOfBirth: optionalDateOnly,
  memberSince: optionalDateOnly,
});
