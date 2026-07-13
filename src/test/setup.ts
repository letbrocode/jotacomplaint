import { vi } from "vitest";

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

// Mock QStash publisher — prevents real HTTP calls to QStash in unit tests
vi.mock("~/lib/qstash", () => ({
  publishJob: vi.fn().mockResolvedValue(undefined),
  jobUrl: vi.fn((path: string) => `http://localhost:3000${path}`),
  qstashClient: {},
}));

// Mock Notification Service
vi.mock("~/server/services/notification.service", () => ({
  getUnreadCount: vi.fn().mockResolvedValue(0),
}));

// NOTE: ~/server/storage/s3.service is intentionally NOT mocked globally.
// s3.service.test.ts mocks its own dependencies (~/env, @aws-sdk/s3-request-presigner)
// so it can test the real service implementation.
// If a future service test imports s3 functions indirectly, add a local vi.mock there.
