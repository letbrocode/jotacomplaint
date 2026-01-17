import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { ActivityAction, NotificationType } from "@prisma/client";

type CreateCommentBody = {
  content: string;
  isInternal?: boolean;
};

// POST - Add a comment to a complaint
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const data = (await req.json()) as CreateCommentBody;
    const content = data.content?.trim();
    const isInternal = data.isInternal ?? false;

    if (!content || content.length < 1) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment is too long (max 2000 characters)" },
        { status: 400 },
      );
    }

    const complaint = await db.complaint.findUnique({
      where: { id },
      include: {
        user: true,
        assignedTo: true,
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    if (complaint.deletedAt) {
      return NextResponse.json(
        { error: "Cannot comment on deleted complaint" },
        { status: 403 },
      );
    }

    const canPostInternal =
      session.user.role === "ADMIN" || session.user.role === "STAFF";
    const commentIsInternal = isInternal && canPostInternal;

    if (
      session.user.role === "STAFF" &&
      complaint.assignedToId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You can only comment on complaints assigned to you" },
        { status: 403 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          content,
          isInternal: commentIsInternal,
          complaintId: id,
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

      await tx.complaint.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      await tx.complaintActivity.create({
        data: {
          complaintId: id,
          userId: session.user.id,
          action: ActivityAction.COMMENT_ADDED,
          comment: commentIsInternal
            ? "Added an internal comment"
            : "Added a comment",
        },
      });

      if (!commentIsInternal) {
        const notificationsToCreate = [];

        if (complaint.userId !== session.user.id) {
          notificationsToCreate.push({
            userId: complaint.userId,
            complaintId: id,
            title: "New Comment",
            message: `${session.user.name ?? "Someone"} commented on your complaint`,
            type: NotificationType.COMMENT_ADDED,
          });
        }

        if (
          complaint.assignedToId &&
          complaint.assignedToId !== session.user.id &&
          complaint.assignedToId !== complaint.userId
        ) {
          notificationsToCreate.push({
            userId: complaint.assignedToId,
            complaintId: id,
            title: "New Comment on Assigned Complaint",
            message: `${session.user.name ?? "Someone"} commented on complaint: ${complaint.title}`,
            type: NotificationType.COMMENT_ADDED,
          });
        }

        if (notificationsToCreate.length > 0) {
          await tx.notification.createMany({
            data: notificationsToCreate,
          });
        }
      }

      return comment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Error creating comment:", err);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}

// GET - Get all comments for a complaint
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    const { id } = await params;

    const complaint = await db.complaint.findUnique({
      where: { id },
    });

    if (!complaint || complaint.deletedAt) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    const canSeeInternal =
      session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);

    const comments = await db.comment.findMany({
      where: {
        complaintId: id,
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

    const totalCount = await db.comment.count({
      where: {
        complaintId: id,
        ...(canSeeInternal ? {} : { isInternal: false }),
      },
    });

    const hasMore = offset + comments.length < totalCount;

    return NextResponse.json({
      comments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore,
      },
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}
