import { db } from "~/server/db";
import { NotFoundError, ForbiddenError } from "~/lib/errors";
import { ActivityAction, NotificationType, type Role } from "@prisma/client";
import type { CreateCommentInput } from "~/schemas/comment.schema";

export async function createComment(
  data: CreateCommentInput,
  userId: string,
  userRole: Role,
  userName: string,
) {
  const { complaintId, content, isInternal } = data;

  const complaint = await db.complaint.findUnique({
    where: { id: complaintId, deletedAt: null },
    include: { user: true },
  });

  if (!complaint) throw new NotFoundError("Complaint");

  // Authorization checks
  if (userRole === "STAFF") {
    const isAssigned = complaint.assignedToId === userId;
    const isInDept = complaint.departmentId
      ? await db.department.findFirst({
          where: { id: complaint.departmentId, staff: { some: { id: userId } } },
        })
      : null;
    if (!isAssigned && !isInDept) {
      throw new ForbiddenError("You can only comment on complaints in your department or assigned to you");
    }
  } else if (userRole === "USER") {
    if (complaint.userId !== userId) {
      throw new ForbiddenError("You can only comment on your own complaints");
    }
    if (isInternal) {
      throw new ForbiddenError("Citizens cannot post internal comments");
    }
  }

  const commentIsInternal = isInternal && (userRole === "ADMIN" || userRole === "STAFF");

  return db.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        content,
        isInternal: commentIsInternal,
        complaintId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await tx.complaint.update({
      where: { id: complaintId },
      data: { updatedAt: new Date() },
    });

    await tx.complaintActivity.create({
      data: {
        complaintId,
        userId,
        action: ActivityAction.COMMENT_ADDED,
        comment: commentIsInternal ? "Added an internal comment" : "Added a comment",
      },
    });

    if (!commentIsInternal) {
      const notifications = [];

      // Notify owner if not the author
      if (complaint.userId !== userId) {
        notifications.push({
          userId: complaint.userId,
          complaintId,
          title: "New Comment",
          message: `${userName} commented on your complaint`,
          type: NotificationType.COMMENT_ADDED,
        });
      }

      // Notify assigned staff if not the author
      if (complaint.assignedToId && complaint.assignedToId !== userId && complaint.assignedToId !== complaint.userId) {
        notifications.push({
          userId: complaint.assignedToId,
          complaintId,
          title: "New Comment",
          message: `${userName} commented on assigned complaint: ${complaint.title}`,
          type: NotificationType.COMMENT_ADDED,
        });
      }

      if (notifications.length > 0) {
        await tx.notification.createMany({ data: notifications });
      }
    }

    return comment;
  });
}

export async function getCommentsForComplaint(
  complaintId: string,
  userRole: Role,
) {
  const canSeeInternal = userRole === "ADMIN" || userRole === "STAFF";

  return db.comment.findMany({
    where: {
      complaintId,
      ...(canSeeInternal ? {} : { isInternal: false }),
    },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
