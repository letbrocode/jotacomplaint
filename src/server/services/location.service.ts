import { db } from "~/server/db";
import { NotFoundError } from "~/lib/errors";
import { LocationType } from "@prisma/client";
import { z } from "zod";

// ============================================
// Location Service
// ============================================

export const createLocationSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  type: z.nativeEnum(LocationType),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().max(500).trim().optional().nullable(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export async function getLocations(type?: LocationType) {
  return db.publicLocation.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getLocationById(id: string) {
  const loc = await db.publicLocation.findUnique({ where: { id } });
  if (!loc) throw new NotFoundError("Location");
  return loc;
}

export async function createLocation(data: CreateLocationInput) {
  return db.publicLocation.create({ data });
}

export async function updateLocation(id: string, data: Partial<CreateLocationInput>) {
  const loc = await db.publicLocation.findUnique({ where: { id } });
  if (!loc) throw new NotFoundError("Location");
  return db.publicLocation.update({ where: { id }, data });
}

export async function deactivateLocation(id: string) {
  const loc = await db.publicLocation.findUnique({ where: { id } });
  if (!loc) throw new NotFoundError("Location");
  return db.publicLocation.update({ where: { id }, data: { isActive: false } });
}

/**
 * Fetch all geolocated complaints for map views.
 * Staff-scoped: only returns complaints assigned to the given staffId
 * (or all complaints if no staffId provided, for admin).
 */
export async function getComplaintsForMap(staffId?: string) {
  return db.complaint.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(staffId
        ? {
            assignedToId: staffId,
            status: { in: ["PENDING", "IN_PROGRESS"] },
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      latitude: true,
      longitude: true,
      location: true,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}
