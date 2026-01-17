import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import {
  ActivityAction,
  type Priority,
  type ComplaintCategory as Category,
  Status,
} from "@prisma/client";

type CreateComplaintBody = {
  title: string;
  details: string;
  category: Category;
  priority: Priority;
  location?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  photoUrl?: string | null;
  departmentId?: number | null;
};

export async function GET() {
  try {
    const session = await auth();

    if (session?.user?.role === "ADMIN") {
      const complaints = await db.complaint.findMany({
        where: { deletedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          department: {
            select: { id: true, name: true, email: true, phone: true },
          },
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true, activities: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(complaints);
    }

    if (session?.user?.role === "STAFF" && session.user.id) {
      const complaints = await db.complaint.findMany({
        where: {
          deletedAt: null,
          OR: [
            { assignedToId: session.user.id },
            {
              department: {
                staff: { some: { id: session.user.id } },
              },
            },
          ],
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: true,
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(complaints);
    }

    if (session?.user?.id) {
      const complaints = await db.complaint.findMany({
        where: { userId: session.user.id, deletedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
          assignedTo: { select: { name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(complaints);
    }

    return NextResponse.json(
      { error: "Unauthorized - please login" },
      { status: 401 },
    );
  } catch (err) {
    console.error("Error fetching complaints:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to submit a complaint" },
        { status: 401 },
      );
    }

    const data = (await req.json()) as CreateComplaintBody;

    const title = data.title?.trim();
    const details = data.details?.trim();
    const category = data.category;
    const priority = data.priority;
    const location = data.location?.trim() ?? null;
    const photoUrl = data.photoUrl?.trim() ?? null;
    const departmentId = data.departmentId ?? null;

    if (!title || !details || !category || !priority) {
      return NextResponse.json(
        { error: "Title, details, category, and priority are required" },
        { status: 400 },
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { error: "Title must be at least 5 characters" },
        { status: 400 },
      );
    }

    if (details.length < 20) {
      return NextResponse.json(
        { error: "Please provide more details (at least 20 characters)" },
        { status: 400 },
      );
    }

    const lat =
      typeof data.latitude === "string"
        ? Number.parseFloat(data.latitude)
        : (data.latitude ?? null);

    const lng =
      typeof data.longitude === "string"
        ? Number.parseFloat(data.longitude)
        : (data.longitude ?? null);

    const complaint = await db.$transaction(async (tx) => {
      const newComplaint = await tx.complaint.create({
        data: {
          title,
          details,
          category,
          priority,
          status: Status.PENDING,
          location,
          latitude: lat,
          longitude: lng,
          photoUrl,
          userId: session.user.id,
          departmentId,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: true,
          _count: { select: { comments: true } },
        },
      });

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
  } catch (err: unknown) {
    console.error("Error creating complaint:", err);

    if (
      err instanceof Error &&
      err.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        { error: "Invalid department or user reference" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create complaint. Please try again." },
      { status: 500 },
    );
  }
}
