import { db } from "~/server/db";
import { subDays, startOfDay } from "date-fns";
import { getCached, CacheKeys } from "~/lib/cache";

// ============================================
// Analytics Service — expensive queries cached
// in Upstash Redis (5-min TTL).
// Cache is invalidated by invalidateCache() in
// the PATCH /api/complaints/[id] route handler.
// ============================================

export async function getDashboardStats() {
  return getCached(CacheKeys.dashboardStats, _getDashboardStats, 300);
}

async function _getDashboardStats() {
  const [total, pending, inProgress, resolved, rejected, escalated] =
    await Promise.all([
      db.complaint.count({ where: { deletedAt: null } }),
      db.complaint.count({ where: { deletedAt: null, status: "PENDING" } }),
      db.complaint.count({ where: { deletedAt: null, status: "IN_PROGRESS" } }),
      db.complaint.count({ where: { deletedAt: null, status: "RESOLVED" } }),
      db.complaint.count({ where: { deletedAt: null, status: "REJECTED" } }),
      db.complaint.count({ where: { deletedAt: null, status: "ESCALATED" } }),
    ]);

  const completionRate = total > 0 ? (resolved / total) * 100 : 0;

  // Week-over-week
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);

  const [thisWeek, lastWeek] = await Promise.all([
    db.complaint.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
    db.complaint.count({
      where: { deletedAt: null, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),
  ]);

  const trend =
    lastWeek === 0 ? "neutral" : thisWeek > lastWeek ? "up" : thisWeek < lastWeek ? "down" : "neutral";
  const trendPct = lastWeek === 0 ? 0 : Math.abs(((thisWeek - lastWeek) / lastWeek) * 100);

  return {
    total,
    pending,
    inProgress,
    resolved,
    rejected,
    escalated,
    completionRate,
    thisWeek,
    trend,
    trendPct,
  };
}

export async function getTrendData(days = 30) {
  const from = startOfDay(subDays(new Date(), days));

  const complaints = await db.complaint.findMany({
    where: { deletedAt: null, createdAt: { gte: from } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const byDate: Record<string, { date: string; count: number; resolved: number }> = {};

  for (const c of complaints) {
    const key = c.createdAt.toISOString().split("T")[0]!;
    byDate[key] ??= { date: key, count: 0, resolved: 0 };
    byDate[key].count++;
    if (c.status === "RESOLVED") byDate[key].resolved++;
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDepartmentBreakdown() {
  return getCached(CacheKeys.departmentBreakdown, _getDepartmentBreakdown, 300);
}

async function _getDepartmentBreakdown() {
  const departments = await db.department.findMany({
    where: { isActive: true },
    include: {
      complaints: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return departments.map((dept) => ({
    department: dept.name,
    total: dept.complaints.length,
    pending: dept.complaints.filter((c) => c.status === "PENDING").length,
    inProgress: dept.complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: dept.complaints.filter((c) => c.status === "RESOLVED").length,
    escalated: dept.complaints.filter((c) => c.status === "ESCALATED").length,
  }));
}


export async function getPublicStats() {
  const [users, resolved] = await Promise.all([
    db.user.count({ where: { isActive: true, role: "USER" } }),
    db.complaint.count({ where: { status: "RESOLVED" } }),
  ]);

  // Average resolution time in hours
  const resolvedComplaints = await db.complaint.findMany({
    where: { status: "RESOLVED", resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
    take: 500,
  });

  let avgHours = 0;
  if (resolvedComplaints.length > 0) {
    const totalHours = resolvedComplaints.reduce((sum, c) => {
      const diff = (c.resolvedAt!.getTime() - c.createdAt.getTime()) / 1000 / 3600;
      return sum + diff;
    }, 0);
    avgHours = Math.round(totalHours / resolvedComplaints.length);
  }

  return { users, resolved, avgHours };
}
