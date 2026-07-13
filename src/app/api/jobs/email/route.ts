import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { sendEmail } from "~/server/email/send";
import { ComplaintCreatedEmail } from "~/server/email/templates/complaint-created";
import { ComplaintAssignedEmail } from "~/server/email/templates/complaint-assigned";
import { StatusUpdatedEmail } from "~/server/email/templates/status-updated";
import { ComplaintResolvedEmail } from "~/server/email/templates/complaint-resolved";
import { ComplaintRejectedEmail } from "~/server/email/templates/complaint-rejected";
import type { EmailJobData } from "~/server/jobs/types";
import { logger } from "~/lib/logger";
import React from "react";

// ============================================
// POST /api/jobs/email
// QStash-delivered email job handler.
// Replaces src/server/jobs/workers/email.worker.ts
// Signature is verified by verifySignatureAppRouter.
// ============================================

async function handler(req: NextRequest) {
  const data = (await req.json()) as EmailJobData;

  logger.info({ type: data.type }, "[jobs/email] Processing job");

  switch (data.type) {
    case "complaint-created": {
      const complaint = await db.complaint.findUnique({
        where: { id: data.complaintId },
        include: { user: true },
      });
      if (!complaint?.user.email) break;

      await sendEmail({
        to: complaint.user.email,
        subject: "Your complaint has been received",
        react: React.createElement(ComplaintCreatedEmail, {
          userName: complaint.user.name ?? "Citizen",
          complaintTitle: complaint.title,
          complaintId: complaint.id,
          category: complaint.category,
        }),
      });
      break;
    }

    case "complaint-assigned": {
      const complaint = await db.complaint.findUnique({
        where: { id: data.complaintId },
        include: { assignedTo: true },
      });
      if (!complaint?.assignedTo?.email) break;

      await sendEmail({
        to: complaint.assignedTo.email,
        subject: "New complaint assigned to you",
        react: React.createElement(ComplaintAssignedEmail, {
          staffName: complaint.assignedTo.name ?? "Staff",
          complaintTitle: complaint.title,
          complaintId: complaint.id,
          priority: complaint.priority,
          category: complaint.category,
        }),
      });
      break;
    }

    case "status-updated": {
      const complaint = await db.complaint.findUnique({
        where: { id: data.complaintId },
        include: { user: true },
      });
      if (!complaint?.user.email) break;

      await sendEmail({
        to: complaint.user.email,
        subject: `Complaint status updated: ${data.newStatus}`,
        react: React.createElement(StatusUpdatedEmail, {
          userName: complaint.user.name ?? "Citizen",
          complaintTitle: complaint.title,
          complaintId: complaint.id,
          newStatus: data.newStatus,
        }),
      });
      break;
    }

    case "complaint-resolved": {
      const complaint = await db.complaint.findUnique({
        where: { id: data.complaintId },
        include: { user: true },
      });
      if (!complaint?.user.email) break;

      await sendEmail({
        to: complaint.user.email,
        subject: "Your complaint has been resolved",
        react: React.createElement(ComplaintResolvedEmail, {
          userName: complaint.user.name ?? "Citizen",
          complaintTitle: complaint.title,
          complaintId: complaint.id,
        }),
      });
      break;
    }

    case "complaint-rejected": {
      const complaint = await db.complaint.findUnique({
        where: { id: data.complaintId },
        include: { user: true },
      });
      if (!complaint?.user.email) break;

      await sendEmail({
        to: complaint.user.email,
        subject: "Update on your complaint",
        react: React.createElement(ComplaintRejectedEmail, {
          userName: complaint.user.name ?? "Citizen",
          complaintTitle: complaint.title,
          complaintId: complaint.id,
          rejectionNote: data.rejectionNote,
        }),
      });
      break;
    }

    default:
      logger.warn({ data }, "[jobs/email] Unknown job type received");
  }

  return NextResponse.json({ ok: true });
}

export const POST = verifySignatureAppRouter(handler);
