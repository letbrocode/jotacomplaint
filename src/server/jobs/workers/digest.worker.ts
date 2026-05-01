import { Worker } from "bullmq";
import { ioredis } from "~/lib/ioredis";
import { db } from "~/server/db";
import { sendEmail } from "~/server/email/send";
import { WeeklyDigestEmail } from "~/server/email/templates/weekly-digest";
import type { DigestJobData } from "../queues";
import React from "react";

// ============================================
// Digest Worker — Weekly admin summary
// ============================================

export const digestWorker = new Worker<DigestJobData>(
  "digest",
  async () => {
    // Gather last 7 days stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, resolved, pending, escalated, admins] = await Promise.all([
      db.complaint.count({ where: { createdAt: { gte: weekAgo }, deletedAt: null } }),
      db.complaint.count({ where: { createdAt: { gte: weekAgo }, status: "RESOLVED" } }),
      db.complaint.count({ where: { deletedAt: null, status: "PENDING" } }),
      db.complaint.count({ where: { createdAt: { gte: weekAgo }, status: "ESCALATED" } }),
      db.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { email: true, name: true } }),
    ]);

    for (const admin of admins) {
      if (!admin.email) continue;
      await sendEmail({
        to: admin.email,
        subject: `JotaComplaint Weekly Report — ${new Date().toLocaleDateString()}`,
        react: React.createElement(WeeklyDigestEmail, {
          adminName: admin.name ?? "Admin",
          weeklyTotal: total,
          weeklyResolved: resolved,
          currentPending: pending,
          weeklyEscalated: escalated,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        }),
      });
    }

    console.log(`[digest-worker] Sent weekly digest to ${admins.length} admins`);
  },
  { connection: ioredis },
);

digestWorker.on("failed", (job, err) => {
  console.error(`[digest-worker] Job ${job?.id} failed:`, err.message);
});
