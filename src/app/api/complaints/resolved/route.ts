import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export async function GET() {
  try {
    const session = await auth();

    // Only admins and staff can view resolved complaints
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const complaints = await db.complaint.findMany({
      where: {
        status: "RESOLVED",
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        resolvedAt: "desc", // Most recently resolved first
      },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Error fetching resolved complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch resolved complaints" },
      { status: 500 },
    );
  }
}
