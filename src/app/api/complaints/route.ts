import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export async function GET() {
  try {
    const session = await auth();

    // If admin — fetch ALL complaints
    if (session?.user?.role === "ADMIN") {
      const complaints = await db.complaint.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: true,
          assignedTo: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(complaints);
    }

    // If logged-in regular user — fetch only THEIR complaints
    if (session?.user?.id) {
      const complaints = await db.complaint.findMany({
        where: { userId: session.user.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(complaints);
    }

    // If no session — public viewer, show all complaints (read-only)
    const allComplaints = await db.complaint.findMany({
      include: {
        user: { select: { name: true } }, // limit data for public viewers
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(allComplaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
