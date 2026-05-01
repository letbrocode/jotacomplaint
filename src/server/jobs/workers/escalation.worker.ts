import { Worker } from "bullmq";
import { ioredis } from "~/lib/ioredis";
import { db } from "~/server/db";
import { ActivityAction, NotificationType } from "@prisma/client";
import { triggerUserNotification, triggerDashboardRefresh } from "~/lib/pusher";
import { getUnreadCount } from "~/server/services/notification.service";
import type { EscalationJobData } from "../queues";

// ============================================
// Escalation Worker
// Runs every 15 minutes via cron scheduler.
// Finds overdue complaints and escalates them.
// ============================================

export const escalationWorker = new Worker<EscalationJobData>(
  "escalation",
  async () => {
    const now = new Date();

    // Find all complaints past their SLA due date that aren't already resolved/rejected/escalated
    const overdueComplaints = await db.complaint.findMany({
      where: {
        deletedAt: null,
        dueDate: { lt: now },
        status: { notIn: ["RESOLVED", "REJECTED", "ESCALATED"] },
      },
      include: { user: true },
    });

    if (overdueComplaints.length === 0) {
      console.log("[escalation-worker] No overdue complaints found");
      return;
    }

    console.log(`[escalation-worker] Escalating ${overdueComplaints.length} complaints`);

    for (const complaint of overdueComplaints) {
      await db.$transaction(async (tx) => {
        await tx.complaint.update({
          where: { id: complaint.id },
          data: {
            status: "ESCALATED",
            escalatedAt: now,
          },
        });

        // Log activity
        const adminUser = await tx.user.findFirst({ where: { role: "ADMIN" } });
        if (adminUser) {
          await tx.complaintActivity.create({
            data: {
              complaintId: complaint.id,
              userId: adminUser.id,
              action: ActivityAction.ESCALATED,
              oldValue: complaint.status,
              newValue: "ESCALATED",
              comment: "Auto-escalated: SLA deadline breached",
            },
          });
        }

        // Notify the complaint owner
        await tx.notification.create({
          data: {
            userId: complaint.userId,
            complaintId: complaint.id,
            title: "Complaint Escalated",
            message: `Your complaint "${complaint.title}" has been escalated due to SLA breach.`,
            type: NotificationType.ESCALATED,
          },
        });
      });

      // Push real-time update to user
      try {
        const unreadCount = await getUnreadCount(complaint.userId);
        await triggerUserNotification(complaint.userId, {
          title: "Complaint Escalated",
          message: `"${complaint.title}" has been escalated`,
          unreadCount,
        });
      } catch {
        // Non-fatal — Pusher trigger failure shouldn't block escalation
      }
    }

    // Refresh admin dashboard
    try {
      await triggerDashboardRefresh();
    } catch {}
  },
  { connection: ioredis },
);

escalationWorker.on("failed", (job, err) => {
  console.error(`[escalation-worker] Job ${job?.id} failed:`, err.message);
});
