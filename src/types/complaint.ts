import type { Prisma } from "@prisma/client";

// ============================================
// Complaint List View Type
// ============================================
export const complaintListInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
  department: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true, activities: true } },
} satisfies Prisma.ComplaintInclude;

export type ComplaintWithRelations = Prisma.ComplaintGetPayload<{
  include: typeof complaintListInclude;
}>;

// ============================================
// Complaint Detail View Type
// ============================================
export const complaintDetailInclude = {
  ...complaintListInclude,
  comments: {
    include: { author: { select: { id: true, name: true, role: true } } },
  },
  activities: {
    include: { user: { select: { id: true, name: true, role: true } } },
  },
  parent: { select: { id: true, title: true } },
  duplicates: { select: { id: true, title: true, status: true } },
} satisfies Prisma.ComplaintInclude;

export type ComplaintDetailsWithRelations = Prisma.ComplaintGetPayload<{
  include: typeof complaintDetailInclude;
}>;
