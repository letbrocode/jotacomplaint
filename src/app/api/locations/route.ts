import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "~/lib/auth-guards";
import { getLocations, createLocation, createLocationSchema } from "~/server/services/location.service";
import { handleApiError } from "~/lib/errors";
import { LocationType } from "@prisma/client";

const typeSchema = z.nativeEnum(LocationType).optional();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") ?? undefined;
    const type = typeSchema.parse(typeParam);
    const locations = await getLocations(type);
    return NextResponse.json(locations);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
    const body: unknown = await req.json();
    const data = createLocationSchema.parse(body);
    const location = await createLocation(data);
    return NextResponse.json(location, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
