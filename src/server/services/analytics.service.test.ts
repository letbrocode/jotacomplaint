import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPublicStats } from "~/server/services/analytics.service";

const { mockUserCount, mockComplaintCount, mockFindMany } = vi.hoisted(() => ({
  mockUserCount: vi.fn(),
  mockComplaintCount: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    user: {
      count: mockUserCount,
    },
    complaint: {
      count: mockComplaintCount,
      findMany: mockFindMany,
    },
  },
}));

describe("Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return public stats correctly", async () => {
    mockUserCount.mockResolvedValue(100);
    mockComplaintCount.mockResolvedValue(50);
    mockFindMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-01T10:00:00Z"),
        resolvedAt: new Date("2026-05-01T12:00:00Z"), // 2 hours
      },
      {
        createdAt: new Date("2026-05-02T10:00:00Z"),
        resolvedAt: new Date("2026-05-02T14:00:00Z"), // 4 hours
      },
    ]);

    const stats = await getPublicStats();

    expect(stats.users).toBe(100);
    expect(stats.resolved).toBe(50);
    expect(stats.avgHours).toBe(3); // (2 + 4) / 2 = 3
  });

  it("should handle zero resolved complaints for avgHours", async () => {
    mockUserCount.mockResolvedValue(10);
    mockComplaintCount.mockResolvedValue(0);
    mockFindMany.mockResolvedValue([]);

    const stats = await getPublicStats();

    expect(stats.avgHours).toBe(0);
  });
});
