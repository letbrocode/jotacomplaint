import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { ActivityAction, NotificationType } from "@prisma/client";
import type { EscalationJobData } from "~/server/jobs/types";
import { logger } from "~/lib/logger";

// ============================================
// POST /api/jobs/escalation
// QStash-delivered SLA escalation job.
// Replaces src/server/jobs/workers/escalation.worker.ts
// Triggered every 15 minutes via QStash schedule.
// ============================================

async function handler(_req: NextRequest) {
  const _data = (await _req.json()) as EscalationJobData;

  logger.info("[jobs/escalation] Running SLA check");

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
    logger.info("[jobs/escalation] No overdue complaints found");
    return NextResponse.json({ ok: true, escalated: 0 });
  }

  logger.info(
    { count: overdueComplaints.length },
    "[jobs/escalation] Escalating overdue complaints",
  );

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
  }

  return NextResponse.json({ ok: true, escalated: overdueComplaints.length });
}

export const POST = verifySignatureAppRouter(handler);
