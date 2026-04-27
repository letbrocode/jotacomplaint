import { z } from "zod";

// ============================================
// Department Schemas
// ============================================

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: "Department name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  description: z.string().max(500).trim().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number")
    .optional()
    .nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
