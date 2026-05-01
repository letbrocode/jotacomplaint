import { db } from "~/server/db";

// ============================================
// Duplicate Detection Service
// Uses PostgreSQL pg_trgm trigram similarity
// to find complaints with similar titles.
// Optionally narrows by geospatial proximity
// using the Haversine formula.
//
// Threshold: 0.3 similarity (30% match) —
// tuned to catch real duplicates without
// too many false positives.
// ============================================

export type SimilarComplaint = {
  id: string;
  title: string;
  status: string;
  category: string;
  location: string | null;
  createdAt: Date;
  titleSimilarity: number;
  distanceKm: number | null;
};

type RawSimilarRow = {
  id: string;
  title: string;
  status: string;
  category: string;
  location: string | null;
  created_at: Date;
  title_sim: number;
  distance_km: number | null;
};

/**
 * Find similar open complaints using pg_trgm trigram similarity.
 * Excludes the complaint itself (by id) if provided.
 * Optionally filters by proximity (radiusKm) when lat/lng are supplied.
 */
export async function findSimilarComplaints(
  title: string,
  options: {
    lat?: number | null;
    lng?: number | null;
    radiusKm?: number;
    limit?: number;
    excludeId?: string;
    threshold?: number;
  } = {},
): Promise<SimilarComplaint[]> {
  const {
    lat,
    lng,
    radiusKm = 5,
    limit = 5,
    excludeId,
    threshold = 0.3,
  } = options;

  const hasLocation = lat != null && lng != null;

  // Build the query dynamically based on whether we have coords
  const rows = hasLocation
    ? await db.$queryRaw<RawSimilarRow[]>`
        SELECT
          c.id,
          c.title,
          c.status::text,
          c.category::text,
          c.location,
          c."createdAt" AS created_at,
          similarity(c.title, ${title}) AS title_sim,
          ROUND(
            (6371 * acos(
              cos(radians(${lat})) *
              cos(radians(c.latitude)) *
              cos(radians(c.longitude) - radians(${lng})) +
              sin(radians(${lat})) *
              sin(radians(c.latitude))
            ))::numeric,
            2
          ) AS distance_km
        FROM "Complaint" c
        WHERE
          c."deletedAt" IS NULL
          AND c.status NOT IN ('RESOLVED', 'REJECTED')
          AND similarity(c.title, ${title}) > ${threshold}
          ${excludeId ? db.$queryRaw`AND c.id != ${excludeId}` : db.$queryRaw``}
          AND c.latitude IS NOT NULL
          AND c.longitude IS NOT NULL
          AND (
            6371 * acos(
              cos(radians(${lat})) *
              cos(radians(c.latitude)) *
              cos(radians(c.longitude) - radians(${lng})) +
              sin(radians(${lat})) *
              sin(radians(c.latitude))
            )
          ) <= ${radiusKm}
        ORDER BY title_sim DESC, distance_km ASC
        LIMIT ${limit}
      `
    : await db.$queryRaw<RawSimilarRow[]>`
        SELECT
          c.id,
          c.title,
          c.status::text,
          c.category::text,
          c.location,
          c."createdAt" AS created_at,
          similarity(c.title, ${title}) AS title_sim,
          NULL::numeric AS distance_km
        FROM "Complaint" c
        WHERE
          c."deletedAt" IS NULL
          AND c.status NOT IN ('RESOLVED', 'REJECTED')
          AND similarity(c.title, ${title}) > ${threshold}
          ${excludeId ? db.$queryRaw`AND c.id != ${excludeId}` : db.$queryRaw``}
        ORDER BY title_sim DESC
        LIMIT ${limit}
      `;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    category: r.category,
    location: r.location,
    createdAt: r.created_at,
    titleSimilarity: Number(r.title_sim),
    distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
  }));
}

/**
 * Mark a complaint as a duplicate of a parent complaint.
 * Updates both `isDuplicate` and `parentId` fields.
 */
export async function markAsDuplicate(
  complaintId: string,
  parentId: string,
): Promise<void> {
  await db.complaint.update({
    where: { id: complaintId },
    data: { isDuplicate: true, parentId },
  });
}
