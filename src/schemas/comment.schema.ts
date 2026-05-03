import { z } from "zod";

export const createCommentSchema = z.object({
  complaintId: z.string().cuid(),
  content: z
    .string({ required_error: "Comment content is required" })
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters")
    .trim(),
  isInternal: z.boolean().default(false),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
