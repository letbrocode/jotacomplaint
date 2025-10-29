import type { Complaint, Department, User } from "@prisma/client";

export type ComplaintWithRelations = Complaint & {
  user: User;
  department: Department | null;
  assignedTo?: User | null;
  _count?: {
    comments?: number;
    activities?: number;
  };
};
