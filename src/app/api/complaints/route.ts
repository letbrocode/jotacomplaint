import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

// POST - create complaint
export async function POST(req: Request) {
  try {
    const session = await auth();
    console.log("SESSION:", session);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const body = await req.json();
    const { title, details, category, latitude, longitude, photoUrl, priority } = body;

    const complaint = await db.complaint.create({
      data: {
        title,
        details,
        category,
        latitude,
        longitude,
        priority,
        photoUrl,
        userId: session.user.id,
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - list complaints
export async function GET() {
  try {
    const complaints = await db.complaint.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
