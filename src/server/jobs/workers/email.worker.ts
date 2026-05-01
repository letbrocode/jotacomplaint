import { Worker } from "bullmq";
import { ioredis } from "~/lib/ioredis";
import { sendEmail } from "~/server/email/send";
import { db } from "~/server/db";
import { ComplaintCreatedEmail } from "~/server/email/templates/complaint-created";
import { ComplaintAssignedEmail } from "~/server/email/templates/complaint-assigned";
import { StatusUpdatedEmail } from "~/server/email/templates/status-updated";
import { ComplaintResolvedEmail } from "~/server/email/templates/complaint-resolved";
import { ComplaintRejectedEmail } from "~/server/email/templates/complaint-rejected";
import type { EmailJobData } from "../queues";
import React from "react";

// ============================================
// Email Worker — processes all email jobs
// ============================================

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    const { data } = job;

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
    }
  },
  { connection: ioredis, concurrency: 5 },
);

emailWorker.on("failed", (job, err) => {
  console.error(`[email-worker] Job ${job?.id} failed:`, err.message);
});

emailWorker.on("completed", (job) => {
  console.log(`[email-worker] Job ${job.id} completed`);
});
