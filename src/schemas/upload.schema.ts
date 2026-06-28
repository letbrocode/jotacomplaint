import { z } from "zod";

export const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_FILE_SIZE = 10_000_000;

export const complaintPhotoKeySchema = z
  .string()
  .max(300)
  .regex(
    /^complaints\/[A-Za-z0-9_-]+\/[0-9a-f-]+\.(?:jpg|png|webp)$/i,
    "Invalid complaint photo key",
  );

export const presignUploadSchema = z.object({
  contentType: z.enum(allowedImageMimeTypes),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_FILE_SIZE, "File too large. Maximum size is 10MB."),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
