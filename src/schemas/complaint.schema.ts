import { z } from "zod";
import { ComplaintCategory, Priority, Status } from "@prisma/client";

// ============================================
// Complaint Schemas
// ============================================

export const createComplaintSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  details: z
    .string({ required_error: "Details are required" })
    .min(20, "Please provide more detail (at least 20 characters)")
    .max(5000, "Details must be at most 5000 characters")
    .trim(),
  category: z.nativeEnum(ComplaintCategory, {
    required_error: "Category is required",
  }),
  priority: z.nativeEnum(Priority, {
    required_error: "Priority is required",
  }),
  location: z.string().max(500).trim().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  photoUrl: z.string().url("Invalid photo URL").optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
});

export const updateComplaintSchema = z.object({
  status: z.nativeEnum(Status).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedToId: z.string().cuid().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  rejectionNote: z.string().min(5).max(1000).optional(),
});

export const filterComplaintsSchema = z.object({
  status: z.nativeEnum(Status).optional(),
  priority: z.nativeEnum(Priority).optional(),
  category: z.nativeEnum(ComplaintCategory).optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  assignedToId: z.string().optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().min(1).max(100).default(20),
  isDuplicate: z.coerce.boolean().optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
export type FilterComplaintsInput = z.infer<typeof filterComplaintsSchema>;
