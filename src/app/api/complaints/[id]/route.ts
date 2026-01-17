import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  ActivityAction,
  NotificationType,
  type Status,
  type Priority,
} from "@prisma/client";

type UpdateComplaintBody = {
  status?: Status;
  assignedToId?: string | null;
  departmentId?: number | null;
  priority?: Priority;
};

type ActivityPayload = {
  complaintId: string;
  userId: string;
  action: ActivityAction;
  oldValue?: string | null;
  newValue?: string | null;
  comment?: string | null;
};

type NotificationPayload = {
  userId: string;
  complaintId: string;
  title: string;
  message: string;
  type: NotificationType;
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = (await req.json()) as UpdateComplaintBody;
    const { status, assignedToId, departmentId, priority } = data;

    const existing = await db.complaint.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        assignedTo: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    const activities: ActivityPayload[] = [];
    const notifications: NotificationPayload[] = [];

    // STATUS CHANGE
    if (status && status !== existing.status) {
      activities.push({
        complaintId: params.id,
        userId: session.user.id,
        action: ActivityAction.STATUS_CHANGED,
        oldValue: existing.status,
        newValue: status,
        comment: `Status changed from ${existing.status} to ${status}`,
      });

      notifications.push({
        userId: existing.userId,
        complaintId: params.id,
        title: "Status Updated",
        message: `Your complaint status changed to ${status}`,
        type: NotificationType.STATUS_UPDATED,
      });
    }

    // ASSIGNMENT CHANGE
    if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
      const action = existing.assignedToId
        ? ActivityAction.REASSIGNED
        : ActivityAction.ASSIGNED;

      activities.push({
        complaintId: params.id,
        userId: session.user.id,
        action,
        oldValue: existing.assignedToId ?? null,
        newValue: assignedToId ?? null,
        comment: assignedToId
          ? `Complaint ${existing.assignedToId ? "reassigned" : "assigned"}`
          : "Assignment removed",
      });

      if (assignedToId) {
        notifications.push({
          userId: assignedToId,
          complaintId: params.id,
          title: "New Assignment",
          message: `You have been assigned a complaint: ${existing.title}`,
          type: NotificationType.COMPLAINT_ASSIGNED,
        });
      }
    }

    // PRIORITY CHANGE
    if (priority && priority !== existing.priority) {
      activities.push({
        complaintId: params.id,
        userId: session.user.id,
        action: ActivityAction.PRIORITY_CHANGED,
        oldValue: existing.priority,
        newValue: priority,
        comment: `Priority changed from ${existing.priority} to ${priority}`,
      });
    }

    // DEPARTMENT CHANGE
    if (departmentId !== undefined && departmentId !== existing.departmentId) {
      activities.push({
        complaintId: params.id,
        userId: session.user.id,
        action: ActivityAction.DEPARTMENT_CHANGED,
        oldValue: existing.departmentId?.toString() ?? null,
        newValue: departmentId?.toString() ?? null,
        comment: "Department changed",
      });
    }

    // UPDATE TRANSACTION
    const updated = await db.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id: params.id },
        data: {
          ...(status && { status }),
          ...(priority && { priority }),
          assignedToId:
            assignedToId !== undefined
              ? (assignedToId ?? null)
              : existing.assignedToId,
          ...(departmentId !== undefined && {
            departmentId: departmentId ?? null,
          }),
          ...(status === "RESOLVED" &&
            !existing.resolvedAt && {
              resolvedAt: new Date(),
            }),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: true,
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: {
            select: { comments: true, activities: true },
          },
        },
      });

      if (activities.length > 0) {
        await tx.complaintActivity.createMany({ data: activities });
      }

      if (notifications.length > 0) {
        await tx.notification.createMany({ data: notifications });
      }

      return complaint;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Error updating complaint:", err);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
          where:
            session?.user?.role === "ADMIN" || session?.user?.role === "STAFF"
              ? {}
              : { isInternal: false },
        },
        activities: {
          include: {
            user: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    if (
      session?.user?.role !== "ADMIN" &&
      session?.user?.role !== "STAFF" &&
      complaint.userId !== session?.user?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(complaint);
  } catch (err) {
    console.error("Error fetching complaint:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
