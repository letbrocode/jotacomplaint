import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPublicStats } from "~/server/services/analytics.service";
import { db } from "~/server/db";

vi.mock("~/server/db", () => ({
  db: {
    user: {
      count: vi.fn(),
    },
    complaint: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return public stats correctly", async () => {
    vi.mocked(db.user).count.mockResolvedValue(100 as never);
    vi.mocked(db.complaint).count.mockResolvedValue(50 as never);
    vi.mocked(db.complaint).findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-01T10:00:00Z"),
        resolvedAt: new Date("2026-05-01T12:00:00Z"), // 2 hours
      },
      {
        createdAt: new Date("2026-05-02T10:00:00Z"),
        resolvedAt: new Date("2026-05-02T14:00:00Z"), // 4 hours
      },
    ] as never);

    const stats = await getPublicStats();

    expect(stats.users).toBe(100);
    expect(stats.resolved).toBe(50);
    expect(stats.avgHours).toBe(3); // (2 + 4) / 2 = 3
  });

  it("should handle zero resolved complaints for avgHours", async () => {
    vi.mocked(db.user).count.mockResolvedValue(10 as never);
    vi.mocked(db.complaint).count.mockResolvedValue(0 as never);
    vi.mocked(db.complaint).findMany.mockResolvedValue([] as never);

    const stats = await getPublicStats();

    expect(stats.avgHours).toBe(0);
  });
});
