import { vi } from "vitest";

// Mock Pusher
vi.mock("~/lib/pusher", () => ({
  triggerComplaintUpdate: vi.fn().mockResolvedValue({}),
  triggerUserNotification: vi.fn().mockResolvedValue({}),
  triggerDashboardRefresh: vi.fn().mockResolvedValue({}),
}));

// Mock Redis/Cache — pass-through: getCached just calls the fetcher directly
vi.mock("~/lib/cache", () => ({
  invalidateCache: vi.fn().mockResolvedValue({}),
  getCached: vi.fn(<T>(_key: string, fn: () => Promise<T>) => fn()),
  CacheKeys: {
    dashboardStats: "dashboardStats",
    departmentBreakdown: "departmentBreakdown",
    publicStats: "publicStats",
    trendData: (days: number) => `analytics:trend:${days}`,
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
