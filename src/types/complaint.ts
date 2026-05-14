import type { Prisma } from "@prisma/client";

// ============================================
// Derived directly from the DB include shape
// so this type is always structurally correct —
// no manual sync needed if complaintInclude changes.
// ============================================

export type ComplaintWithRelations = Prisma.ComplaintGetPayload<{
  include: {
    user: { select: { id: true, name: true, email: true, role: true } };
    department: { select: { id: true, name: true } };
    assignedTo: { select: { id: true, name: true, email: true } };
    _count: { select: { comments: true, activities: true } };
  };
}>;
