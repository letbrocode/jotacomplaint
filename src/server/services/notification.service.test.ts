// Un-mock the module under test — setup.ts provides a global mock of
// notification.service for use by OTHER tests, but this file tests the
// real implementation so we need to bypass it.
vi.unmock("~/server/services/notification.service");

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from "~/server/services/notification.service";

const {
  mockFindMany,
  mockFindUnique,
  mockUpdate,
  mockUpdateMany,
  mockDelete,
  mockDeleteMany,
  mockCount,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockDelete: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    notification: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
      updateMany: mockUpdateMany,
      delete: mockDelete,
      deleteMany: mockDeleteMany,
      count: mockCount,
    },
  },
}));

const mockNotification = {
  id: "notif-1",
  userId: "user-1",
  title: "Test",
  message: "Test message",
  isRead: false,
  createdAt: new Date(),
};

describe("Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserNotifications", () => {
    it("returns paginated notifications for a user", async () => {
      mockFindMany.mockResolvedValue([mockNotification]);
      mockCount.mockResolvedValue(1);
      const result = await getUserNotifications("user-1");
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("getUnreadCount", () => {
    it("returns unread notification count", async () => {
      mockCount.mockResolvedValue(3);
      const count = await getUnreadCount("user-1");
      expect(count).toBe(3);
      expect(mockCount).toHaveBeenCalledWith({ where: { userId: "user-1", isRead: false } });
    });
  });

  describe("markNotificationRead", () => {
    it("marks a notification as read for the owner", async () => {
      mockFindUnique.mockResolvedValue(mockNotification);
      mockUpdate.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await markNotificationRead("notif-1", "user-1");
      expect(result.isRead).toBe(true);
    });

    it("throws NotFoundError if notification does not belong to user", async () => {
      mockFindUnique.mockResolvedValue({ ...mockNotification, userId: "other-user" });
      await expect(markNotificationRead("notif-1", "user-1")).rejects.toThrow("Notification not found");
    });

    it("throws NotFoundError if notification does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(markNotificationRead("notif-1", "user-1")).rejects.toThrow("Notification not found");
    });
  });

  describe("markAllNotificationsRead", () => {
    it("marks all unread notifications as read for a user", async () => {
      mockUpdateMany.mockResolvedValue({ count: 5 });
      await markAllNotificationsRead("user-1");
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe("deleteNotification", () => {
    it("deletes a notification belonging to the user", async () => {
      mockFindUnique.mockResolvedValue(mockNotification);
      mockDelete.mockResolvedValue(mockNotification);

      await deleteNotification("notif-1", "user-1");
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "notif-1" } });
    });

    it("throws NotFoundError if notification belongs to different user", async () => {
      mockFindUnique.mockResolvedValue({ ...mockNotification, userId: "other" });
      await expect(deleteNotification("notif-1", "user-1")).rejects.toThrow("Notification not found");
    });
  });

  describe("deleteAllNotifications", () => {
    it("deletes all notifications for a user", async () => {
      mockDeleteMany.mockResolvedValue({ count: 10 });
      await deleteAllNotifications("user-1");
      expect(mockDeleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    });
  });
});
