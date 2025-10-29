import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { ActivityAction, NotificationType } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  // Only admins and staff can update
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { status, assignedToId, departmentId, priority } = data;

    // Validate the complaint exists
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

    // Track changes for activity log
    const activities: any[] = [];
    const notifications: any[] = [];

    // Status change
    if (status && status !== existing.status) {
      activities.push({
        complaintId: params.id,
        userId: session.user.id,
        action: ActivityAction.STATUS_CHANGED,
        oldValue: existing.status,
        newValue: status,
        comment: `Status changed from ${existing.status} to ${status}`,
      });

      // Notify user
      notifications.push({
        userId: existing.userId,
        complaintId: params.id,
        title: "Status Updated",
        message: `Your complaint status changed to ${status}`,
        type: NotificationType.STATUS_UPDATED,
      });
    }

    // Assignment change
    if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
      const action = existing.assignedToId
        ? ActivityAction.REASSIGNED
        : ActivityAction.ASSIGNED;

      activities.push({
        complaintId: params.id,
        userId: session.user.id,
        action,
        oldValue: existing.assignedToId || undefined,
        newValue: assignedToId || undefined,
        comment: assignedToId
          ? `Complaint ${existing.assignedToId ? "reassigned" : "assigned"}`
          : "Assignment removed",
      });

      // Notify newly assigned staff
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

    // Priority change
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

    // Department change
    if (departmentId !== undefined && departmentId !== existing.departmentId) {
      activities.push({
        complaintId: params.id,
        userId: session.user.id,
        action: ActivityAction.DEPARTMENT_CHANGED,
        oldValue: existing.departmentId?.toString() || undefined,
        newValue: departmentId?.toString() || undefined,
        comment: "Department changed",
      });
    }

    // Update complaint with transaction for data consistency
    const updated = await db.$transaction(async (tx) => {
      // Update the complaint
      const complaint = await tx.complaint.update({
        where: { id: params.id },
        data: {
          ...(status && { status }),
          ...(priority && { priority }),
          assignedToId:
            assignedToId === undefined
              ? existing.assignedToId
              : assignedToId || null,
          ...(departmentId !== undefined && {
            departmentId: departmentId || null,
          }),
          ...(status === "RESOLVED" &&
            !existing.resolvedAt && {
              resolvedAt: new Date(),
            }),
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
      });

      // Create activity logs
      if (activities.length > 0) {
        await tx.complaintActivity.createMany({
          data: activities,
        });
      }

      // Create notifications
      if (notifications.length > 0) {
        await tx.notification.createMany({
          data: notifications,
        });
      }

      return complaint;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error updating complaint:", error);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 },
    );
  }
}

// GET single complaint
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    const complaint = await db.complaint.findUnique({
      where: { id: params.id },
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
            email: true,
          },
        },
        comments: {
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
            createdAt: "desc",
          },
          where:
            session?.user?.role === "ADMIN" || session?.user?.role === "STAFF"
              ? {} // Show all comments including internal
              : { isInternal: false }, // Hide internal comments from users
        },
        activities: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 },
      );
    }

    // Check permissions
    if (
      session?.user?.role !== "ADMIN" &&
      session?.user?.role !== "STAFF" &&
      complaint.userId !== session?.user?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
