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

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    // ADD: Validate content length
    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: "Comment is too long (max 2000 characters)" },
        { status: 400 },
      );
    }

    // Check if complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        assignedTo: true, // ADD: Include assigned staff for notification
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    // ADD: Check if complaint is deleted (soft delete)
    if (complaint.deletedAt) {
      return NextResponse.json(
        { error: "Cannot comment on deleted complaint" },
        { status: 403 },
      );
    }

    // Only allow internal comments for admin/staff
    const canPostInternal = ["ADMIN", "STAFF"].includes(session.user.role);
    const commentIsInternal = isInternal && canPostInternal;

    // ADD: Staff can only comment on assigned complaints
    if (
      session.user.role === "STAFF" &&
      complaint.assignedToId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You can only comment on complaints assigned to you" },
        { status: 403 },
      );
    }

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

      // Update complaint's updatedAt timestamp
      await tx.complaint.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
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

      // IMPROVED: More comprehensive notification logic
      if (!commentIsInternal) {
        const notificationsToCreate = [];

        // Notify complaint owner if not the commenter
        if (complaint.userId !== session.user.id) {
          notificationsToCreate.push({
            userId: complaint.userId,
            complaintId: params.id,
            title: "New Comment",
            message: `${session.user.name || "Someone"} commented on your complaint`,
            type: NotificationType.COMMENT_ADDED,
          });
        }

        // Notify assigned staff if exists, not the commenter, and different from owner
        if (
          complaint.assignedToId &&
          complaint.assignedToId !== session.user.id &&
          complaint.assignedToId !== complaint.userId
        ) {
          notificationsToCreate.push({
            userId: complaint.assignedToId,
            complaintId: params.id,
            title: "New Comment on Assigned Complaint",
            message: `${session.user.name || "Someone"} commented on complaint: ${complaint.title}`,
            type: NotificationType.COMMENT_ADDED,
          });
        }

        // Batch create notifications
        if (notificationsToCreate.length > 0) {
          await tx.notification.createMany({
            data: notificationsToCreate,
          });
        }
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

    // ADD: Check if deleted
    if (complaint.deletedAt) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    // Determine if user can see internal comments
    const canSeeInternal =
      session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

    // ADD: Optional filtering and pagination
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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
      take: limit,
      skip: offset,
    });

    // ADD: Return total count for pagination
    const totalCount = await db.comment.count({
      where: {
        complaintId: params.id,
        ...(canSeeInternal ? {} : { isInternal: false }),
      },
    });

    return NextResponse.json({
      comments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + comments.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}
