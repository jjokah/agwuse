import { z } from "zod/v4";

export const submissionSchema = z.object({
  name: z.string().min(2, { error: "Name is required" }).max(150),
  email: z.email({ error: "Enter a valid email address" }).optional().or(z.literal("")),
  content: z.string().min(10, { error: "Please write at least 10 characters" }).max(5000),
  isPublic: z.boolean().default(false),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
