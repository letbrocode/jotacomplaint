"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "~/lib/auth-guards";
import { actionOk, actionErr } from "~/lib/api";
import { createComplaintSchema, updateComplaintSchema } from "~/schemas/complaint.schema";
import {
  createComplaint,
  updateComplaint,
  deleteComplaint,
  findSimilarComplaints,
} from "~/server/services/complaint.service";
import { emailQueue } from "~/server/jobs/queues";
import {
  triggerComplaintUpdate,
  triggerDashboardRefresh,
  triggerUserNotification,
} from "~/lib/pusher";
import { getUnreadCount } from "~/server/services/notification.service";
import { invalidateCache, CacheKeys } from "~/lib/cache";

// ============================================
// Complaint Server Actions
// ============================================

export async function createComplaintAction(raw: unknown) {
  try {
    const session = await requireAuth();
    const data = createComplaintSchema.parse(raw);
    const complaint = await createComplaint(data, session.user.id);

    // Queue confirmation email
    await emailQueue.add("complaint-created", {
      type: "complaint-created",
      complaintId: complaint.id,
      userId: session.user.id,
    });

    // Invalidate dashboard cache + trigger real-time refresh
    await invalidateCache(CacheKeys.dashboardStats, CacheKeys.departmentBreakdown);
    await triggerDashboardRefresh().catch(() => null);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");
    return actionOk(complaint);
  } catch (err) {
    return actionErr(err);
  }
}

export async function updateComplaintAction(id: string, raw: unknown) {
  try {
    const session = await requireRole("ADMIN", "STAFF");
    const data = updateComplaintSchema.parse(raw);
    const complaint = await updateComplaint(
      id,
      data,
      session.user.id,
      session.user.role,
    );

    // Queue appropriate email
    if (data.status === "RESOLVED") {
      void emailQueue.add("complaint-resolved", {
        type: "complaint-resolved",
        complaintId: id,
        userId: complaint.userId,
      }).catch(() => null);
    } else if (data.status === "REJECTED" && data.rejectionNote) {
      void emailQueue.add("complaint-rejected", {
        type: "complaint-rejected",
        complaintId: id,
        userId: complaint.userId,
        rejectionNote: data.rejectionNote,
      }).catch(() => null);
    } else if (data.status) {
      void emailQueue.add("status-updated", {
        type: "status-updated",
        complaintId: id,
        userId: complaint.userId,
        newStatus: data.status,
      }).catch(() => null);
    }

    if (data.assignedToId) {
      void emailQueue.add("complaint-assigned", {
        type: "complaint-assigned",
        complaintId: id,
        assignedToId: data.assignedToId,
      }).catch(() => null);
    }

    // Push real-time update to complaint channel
    await triggerComplaintUpdate(id, {
      id,
      status: complaint.status,
      assignedToId: complaint.assignedToId,
      updatedAt: complaint.updatedAt.toISOString(),
    }).catch(() => null);

    // Notify the complaint owner in real-time
    const unreadCount = await getUnreadCount(complaint.userId);
    await triggerUserNotification(complaint.userId, {
      title: "Complaint Updated",
      message: `Your complaint status changed to ${complaint.status}`,
      unreadCount,
    }).catch(() => null);

    // Refresh admin dashboard
    await invalidateCache(CacheKeys.dashboardStats).catch(() => null);
    await triggerDashboardRefresh().catch(() => null);

    revalidatePath("/admin/complaints");
    revalidatePath(`/admin/complaints/${id}`);
    revalidatePath("/staff/complaints");
    revalidatePath(`/staff/complaints/${id}`);
    return actionOk(complaint);
  } catch (err) {
    return actionErr(err);
  }
}

export async function deleteComplaintAction(id: string) {
  try {
    await requireRole("ADMIN");
    await deleteComplaint(id);
    await invalidateCache(CacheKeys.dashboardStats, CacheKeys.departmentBreakdown);
    await triggerDashboardRefresh().catch(() => null);
    revalidatePath("/admin/complaints");
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}

export async function findSimilarComplaintsAction(
  title: string,
  lat?: number,
  lng?: number,
) {
  try {
    await requireAuth();
    const results = await findSimilarComplaints(title, lat, lng);
    return actionOk(results);
  } catch (err) {
    return actionErr(err);
  }
}
