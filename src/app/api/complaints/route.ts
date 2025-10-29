import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export async function GET() {
  try {
    const session = await auth();

    // Admin - fetch ALL complaints with full details
    if (session?.user?.role === "ADMIN") {
      const complaints = await db.complaint.findMany({
        where: {
          deletedAt: null, // Exclude soft-deleted complaints
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
              activities: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(complaints);
    }

    // Staff - fetch complaints from their departments or assigned to them
    if (session?.user?.role === "STAFF" && session.user.id) {
      const complaints = await db.complaint.findMany({
        where: {
          deletedAt: null,
          OR: [
            { assignedToId: session.user.id },
            {
              department: {
                staff: {
                  some: {
                    id: session.user.id,
                  },
                },
              },
            },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          department: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(complaints);
    }

    // Regular user - fetch only THEIR complaints
    if (session?.user?.id) {
      const complaints = await db.complaint.findMany({
        where: {
          userId: session.user.id,
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
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(complaints);
    }

    // No session - unauthorized
    return NextResponse.json(
      { error: "Unauthorized - please login" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
