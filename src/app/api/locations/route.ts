import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { LocationType } from "@prisma/client";

type CreateLocationInput = {
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  description?: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where = {
      isActive: true,
      ...(type && Object.values(LocationType).includes(type as LocationType)
        ? { type: type as LocationType }
        : {}),
    };

    const locations = await db.publicLocation.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateLocationInput;

    const location = await db.publicLocation.create({
      data: {
        name: body.name,
        type: body.type,
        latitude: body.latitude,
        longitude: body.longitude,
        description: body.description ?? null,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 },
    );
  }
}
