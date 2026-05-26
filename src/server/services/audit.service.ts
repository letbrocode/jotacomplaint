import { db } from "~/server/db";
import type { ActivityAction } from "@prisma/client";

export interface AuditLogFilter {
  action?: ActivityAction;
  complaintId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export async function getAuditLog(filter: AuditLogFilter = {}) {
  const { action, complaintId, userId, page = 1, pageSize = 25 } = filter;

  const where = {
    ...(action ? { action } : {}),
    ...(complaintId ? { complaintId } : {}),
    ...(userId ? { userId } : {}),
  };

  const [entries, total] = await Promise.all([
    db.complaintActivity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        complaint: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.complaintActivity.count({ where }),
  ]);

  return { entries, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
