import { vi } from "vitest";

// Mock Pusher
vi.mock("~/lib/pusher", () => ({
  triggerComplaintUpdate: vi.fn().mockResolvedValue({}),
  triggerUserNotification: vi.fn().mockResolvedValue({}),
  triggerDashboardRefresh: vi.fn().mockResolvedValue({}),
}));

// Mock Redis/Cache
vi.mock("~/lib/cache", () => ({
  invalidateCache: vi.fn().mockResolvedValue({}),
  getCached: vi.fn((key, fn) => fn()),
  CacheKeys: {
    dashboardStats: "dashboardStats",
    departmentBreakdown: "departmentBreakdown",
  },
}));

// Mock Email Queue
vi.mock("~/server/jobs/queues", () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));

// Mock Notification Service
vi.mock("~/server/services/notification.service", () => ({
  getUnreadCount: vi.fn().mockResolvedValue(0),
}));
