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
    (db.user.count as any).mockResolvedValue(100);
    (db.complaint.count as any).mockResolvedValue(50);
    (db.complaint.findMany as any).mockResolvedValue([
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
    (db.user.count as any).mockResolvedValue(10);
    (db.complaint.count as any).mockResolvedValue(0);
    (db.complaint.findMany as any).mockResolvedValue([]);

    const stats = await getPublicStats();

    expect(stats.avgHours).toBe(0);
  });
});
