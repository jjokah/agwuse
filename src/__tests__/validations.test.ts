import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { transactionSchema, pledgeSchema } from "@/lib/validations/finance";
import {
  blogPostSchema,
  eventSchema,
  sermonSchema,
  departmentSchema,
  liveStreamSchema,
} from "@/lib/validations/content";
import { submissionSchema } from "@/lib/validations/submission";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/user";

describe("Validation Schemas", () => {
  describe("Auth Schemas", () => {
    it("validates valid login input", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "Password123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email in login", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "Password123!",
      });
      expect(result.success).toBe(false);
    });

    it("enforces strong password in registration", () => {
      const weak = registerSchema.safeParse({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "weak",
        confirmPassword: "weak",
      });
      expect(weak.success).toBe(false);

      const strong = registerSchema.safeParse({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "StrongPassword1",
        confirmPassword: "StrongPassword1",
      });
      expect(strong.success).toBe(true);
    });

    it("rejects non-matching password confirmation", () => {
      const mismatch = registerSchema.safeParse({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "StrongPassword1",
        confirmPassword: "DifferentPassword1",
      });
      expect(mismatch.success).toBe(false);
    });

    it("validates forgot password email", () => {
      expect(forgotPasswordSchema.safeParse({ email: "valid@example.com" }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);
    });

    it("validates reset password schema", () => {
      const valid = resetPasswordSchema.safeParse({
        token: "test-token",
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("Finance Schemas", () => {
    it("validates transaction with required fields", () => {
      const result = transactionSchema.safeParse({
        type: "TITHE",
        amount: 5000,
        paymentMethod: "BANK_TRANSFER",
        date: "2026-03-10",
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative or zero transaction amount", () => {
      const negative = transactionSchema.safeParse({
        type: "OFFERING",
        amount: -100,
        paymentMethod: "CASH",
        date: "2026-03-10",
      });
      expect(negative.success).toBe(false);

      const zero = transactionSchema.safeParse({
        type: "OFFERING",
        amount: 0,
        paymentMethod: "CASH",
        date: "2026-03-10",
      });
      expect(zero.success).toBe(false);
    });

    it("validates pledge input", () => {
      const result = pledgeSchema.safeParse({
        title: "Building Project",
        amount: 100000,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        memberId: "user-123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Content Schemas", () => {
    it("validates blog post schema", () => {
      const valid = blogPostSchema.safeParse({
        title: "Sunday Revival Recap",
        content: "This is the content of the blog post.",
        type: "BLOG",
      });
      expect(valid.success).toBe(true);

      const tooShort = blogPostSchema.safeParse({
        title: "A",
        content: "Short",
        type: "BLOG",
      });
      expect(tooShort.success).toBe(false);
    });

    it("validates event schema", () => {
      const valid = eventSchema.safeParse({
        title: "Easter Revival Service",
        startDate: "2026-04-05T09:00:00Z",
        type: "REVIVAL",
      });
      expect(valid.success).toBe(true);
    });

    it("validates livestream URLs strictly", () => {
      const valid = liveStreamSchema.safeParse({
        youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      });
      expect(valid.success).toBe(true);

      const invalid = liveStreamSchema.safeParse({
        youtubeUrl: "https://evil.com/video",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates sermon schema", () => {
      const valid = sermonSchema.safeParse({
        title: "Walking in Divine Purpose",
        speaker: "Rev. Dr. Emeka",
        date: "2026-02-15",
      });
      expect(valid.success).toBe(true);
    });

    it("validates department schema", () => {
      const valid = departmentSchema.safeParse({
        name: "Ushering Department",
        category: "COMMITTEE",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("Submission Schema", () => {
    it("validates prayer request and testimony content", () => {
      const valid = submissionSchema.safeParse({
        name: "Brother Mark",
        content: "Please pray for my family's healing and protection.",
      });
      expect(valid.success).toBe(true);

      const tooShort = submissionSchema.safeParse({
        name: "Mark",
        content: "Pray",
      });
      expect(tooShort.success).toBe(false);
    });
  });

  describe("User Profile Schemas", () => {
    it("validates profile update", () => {
      const valid = updateProfileSchema.safeParse({
        firstName: "Emmanuel",
        lastName: "Okafor",
        phone: "+2348030000000",
        gender: "MALE",
      });
      expect(valid.success).toBe(true);
    });

    it("validates password change requirements", () => {
      const valid = changePasswordSchema.safeParse({
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword2!",
        confirmPassword: "NewPassword2!",
      });
      expect(valid.success).toBe(true);

      const mismatch = changePasswordSchema.safeParse({
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword2!",
        confirmPassword: "WrongPassword2!",
      });
      expect(mismatch.success).toBe(false);
    });
  });
});
