import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { sendEmail } from "~/server/email/send";
import { WeeklyDigestEmail } from "~/server/email/templates/weekly-digest";
import type { DigestJobData } from "~/server/jobs/types";
import { logger } from "~/lib/logger";
import React from "react";

// ============================================
// POST /api/jobs/digest
// QStash-delivered weekly admin digest job.
// Replaces src/server/jobs/workers/digest.worker.ts
// Triggered every Monday at 9am via QStash schedule.
// ============================================

async function handler(_req: NextRequest) {
  const _data = (await _req.json()) as DigestJobData;

  logger.info("[jobs/digest] Sending weekly digest");

  // Gather last 7 days stats
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, resolved, pending, escalated, admins] = await Promise.all([
    db.complaint.count({
      where: { createdAt: { gte: weekAgo }, deletedAt: null },
    }),
    db.complaint.count({
      where: { createdAt: { gte: weekAgo }, status: "RESOLVED" },
    }),
    db.complaint.count({ where: { deletedAt: null, status: "PENDING" } }),
    db.complaint.count({
      where: { createdAt: { gte: weekAgo }, status: "ESCALATED" },
    }),
    db.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true, name: true },
    }),
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

  logger.info(
    { adminCount: admins.length },
    "[jobs/digest] Sent weekly digest",
  );

  return NextResponse.json({ ok: true, sentTo: admins.length });
}

export const POST = verifySignatureAppRouter(handler);
