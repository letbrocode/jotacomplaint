import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { ActivityAction, NotificationType } from "@prisma/client";

// POST - Add a comment to a complaint
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { content, isInternal } = data;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    // Only allow internal comments for admin/staff
    const canPostInternal = ["ADMIN", "STAFF"].includes(session.user.role);
    const commentIsInternal = isInternal && canPostInternal;

    // Create comment, activity, and notification in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the comment
      const comment = await tx.comment.create({
        data: {
          content: content.trim(),
          isInternal: commentIsInternal,
          complaintId: params.id,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // Create activity log
      await tx.complaintActivity.create({
        data: {
          complaintId: params.id,
          userId: session.user.id,
          action: ActivityAction.COMMENT_ADDED,
          comment: commentIsInternal
            ? "Added an internal comment"
            : "Added a comment",
        },
      });

      // Notify complaint owner if not the commenter and not internal
      if (complaint.userId !== session.user.id && !commentIsInternal) {
        await tx.notification.create({
          data: {
            userId: complaint.userId,
            complaintId: params.id,
            title: "New Comment",
            message: `${session.user.name || "Someone"} commented on your complaint`,
            type: NotificationType.COMMENT_ADDED,
          },
        });
      }

      return comment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}

// GET - Get all comments for a complaint
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    // Determine if user can see internal comments
    const canSeeInternal =
      session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

    const comments = await db.comment.findMany({
      where: {
        complaintId: params.id,
        // Hide internal comments from regular users
        ...(canSeeInternal ? {} : { isInternal: false }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}
