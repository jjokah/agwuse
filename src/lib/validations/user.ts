import { z } from "zod/v4";

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, { error: "First name is required" }).max(100),
  lastName: z.string().min(2, { error: "Last name is required" }).max(100),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  occupation: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "DIVORCED"]).optional(),
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
