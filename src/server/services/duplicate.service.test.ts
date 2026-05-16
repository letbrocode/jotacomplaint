import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "~/server/db";
import { findSimilarComplaints } from "~/server/services/duplicate.service";

vi.mock("~/server/db", () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

describe("Duplicate Service - findSimilarComplaints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps rows without location filters", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    (db.$queryRaw as any).mockResolvedValue([
      {
        id: "c1",
        title: "Road pothole near station",
        status: "PENDING",
        category: "ROADS",
        location: "Dadar",
        created_at: createdAt,
        title_sim: 0.67,
        distance_km: null,
      },
    ]);

    const result = await findSimilarComplaints("Road pothole", {
      threshold: 0.3,
      limit: 5,
    });

    expect(result).toEqual([
      {
        id: "c1",
        title: "Road pothole near station",
        status: "PENDING",
        category: "ROADS",
        location: "Dadar",
        createdAt,
        titleSimilarity: 0.67,
        distanceKm: null,
      },
    ]);
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("maps rows with location filters and excludeId", async () => {
    const createdAt = new Date("2026-01-02T00:00:00.000Z");
    (db.$queryRaw as any).mockResolvedValue([
      {
        id: "c2",
        title: "Water leakage near market",
        status: "IN_PROGRESS",
        category: "WATER",
        location: "Bandra",
        created_at: createdAt,
        title_sim: 0.72,
        distance_km: 1.53,
      },
    ]);

    const result = await findSimilarComplaints("Water leakage", {
      lat: 19.07,
      lng: 72.87,
      radiusKm: 5,
      excludeId: "current-complaint",
      threshold: 0.3,
      limit: 5,
    });

    expect(result).toEqual([
      {
        id: "c2",
        title: "Water leakage near market",
        status: "IN_PROGRESS",
        category: "WATER",
        location: "Bandra",
        createdAt,
        titleSimilarity: 0.72,
        distanceKm: 1.53,
      },
    ]);
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns an empty list when no similar complaints are found", async () => {
    (db.$queryRaw as any).mockResolvedValue([]);

    const result = await findSimilarComplaints("Unique complaint", {
      excludeId: "abc123",
    });

    expect(result).toEqual([]);
  });
});
