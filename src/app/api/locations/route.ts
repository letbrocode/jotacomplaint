import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

// GET all public locations
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const locations = await db.publicLocation.findMany({
      where: {
        isActive: true,
        ...(type && { type: type as any }),
      },
      orderBy: {
        name: "asc",
      },
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

// POST create public location (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, latitude, longitude, description } = body;

    const location = await db.publicLocation.create({
      data: {
        name,
        type,
        latitude,
        longitude,
        description,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 },
    );
  }
}
