import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { ActivityAction } from "@prisma/client";

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

// POST - Create new complaint
export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to submit a complaint" },
        { status: 401 },
      );
    }

    const data = await req.json();
    const {
      title,
      details,
      category,
      priority,
      location,
      latitude,
      longitude,
      photoUrl,
      departmentId,
    } = data;

    // Validate required fields
    if (!title || !details || !category || !priority) {
      return NextResponse.json(
        { error: "Title, details, category, and priority are required" },
        { status: 400 },
      );
    }

    // Validate title length
    if (title.trim().length < 5) {
      return NextResponse.json(
        { error: "Title must be at least 5 characters" },
        { status: 400 },
      );
    }

    // Validate details length
    if (details.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide more details (at least 20 characters)" },
        { status: 400 },
      );
    }

    // Create complaint with activity log in transaction
    const complaint = await db.$transaction(async (tx) => {
      // Create the complaint
      const newComplaint = await tx.complaint.create({
        data: {
          title: title.trim(),
          details: details.trim(),
          category,
          priority,
          status: "PENDING",
          location: location?.trim() || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          photoUrl: photoUrl?.trim() || null,
          userId: session.user.id,
          departmentId: departmentId || null,
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
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      // Create activity log
      await tx.complaintActivity.create({
        data: {
          complaintId: newComplaint.id,
          userId: session.user.id,
          action: ActivityAction.NEW_COMPLAINT,
          comment: "Complaint submitted",
        },
      });

      return newComplaint;
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);

    // Check for specific Prisma errors
    if (error instanceof Error) {
      // Foreign key constraint error
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { error: "Invalid department or user reference" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create complaint. Please try again." },
      { status: 500 },
    );
  }
}
