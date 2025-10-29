import type { Department, User } from "@prisma/client";

export type ComplaintWithRelations = {
  id: string;
  title: string;
  details: string;
  category: string;
  priority: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: User | null;
  department?: Department | null;
  assignedTo?: User | null;
};
