import { db } from "~/server/db";
import { NotFoundError } from "~/lib/errors";
import type { PaginationParams } from "~/lib/pagination";
import { buildCursorQuery, buildPaginatedResponse } from "~/lib/pagination";

// ============================================
// Notification Service
// ============================================

export async function getUserNotifications(
  userId: string,
  pagination: PaginationParams = {},
) {
  const take = pagination.take ?? 20;
  const cursorQuery = buildCursorQuery(pagination);

  const [items, total] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      include: {
        complaint: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      ...cursorQuery,
    }),
    db.notification.count({ where: { userId } }),
  ]);

  return buildPaginatedResponse(items, take, total);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, isRead: false } });
}

export async function markNotificationRead(id: string, userId: string) {
  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification) throw new NotFoundError("Notification");
  if (notification.userId !== userId) throw new NotFoundError("Notification");

  return db.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
