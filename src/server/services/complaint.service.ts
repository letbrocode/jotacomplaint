import { db } from "~/server/db";
import type { Role, Status, Priority, ComplaintCategory, Prisma } from "@prisma/client";
import { ActivityAction, NotificationType } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "~/lib/errors";
import {
  buildCursorQuery,
  buildPaginatedResponse,
  type PaginationParams,
} from "~/lib/pagination";
import { DEFAULT_SLA_HOURS } from "~/lib/complaint";
import { getSLADueDate } from "~/lib/date";
import type { CreateComplaintInput, UpdateComplaintInput } from "~/schemas/complaint.schema";

// ============================================
// Types
// ============================================

export type ComplaintFilters = {
  status?: Status;
  priority?: Priority;
  category?: ComplaintCategory;
  departmentId?: number;
  assignedToId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isDuplicate?: boolean;
};

const complaintInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
  department: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true, activities: true } },
} as const;

function buildComplaintWhere(
  userId: string,
  role: Role,
  filters: ComplaintFilters = {},
): Prisma.ComplaintWhereInput {
  const {
    search,
    status,
    priority,
    category,
    departmentId,
    assignedToId,
    dateFrom,
    dateTo,
    isDuplicate,
  } = filters;

  const and: Prisma.ComplaintWhereInput[] = [];

  if (search?.trim()) {
    const term = search.trim();
    and.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { details: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  if (role === "STAFF") {
    and.push({
      OR: [
        { assignedToId: userId },
        { department: { staff: { some: { id: userId } } } },
      ],
    });
  } else if (role === "USER") {
    and.push({ userId });
  }

  return {
    deletedAt: null,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(category && { category }),
    ...(departmentId && { departmentId }),
    ...(assignedToId && { assignedToId }),
    ...(isDuplicate !== undefined && { isDuplicate }),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }
      : {}),
    ...(and.length > 0 && { AND: and }),
  };
}

// ============================================
// Queries
// ============================================

/**
 * Fetch complaints scoped to the caller's role.
 * ADMIN sees all, STAFF sees their dept/assigned, USER sees their own.
 */
export async function getComplaintsForRole(
  userId: string,
  role: Role,
  filters: ComplaintFilters = {},
  pagination: PaginationParams = {},
) {
  const where = buildComplaintWhere(userId, role, filters);
  const take = pagination.take ?? 20;
  const cursorQuery = buildCursorQuery(pagination);

  const [items, total] = await Promise.all([
    db.complaint.findMany({
      where,
      include: complaintInclude,
      orderBy: { createdAt: "desc" },
      ...cursorQuery,
    }),
    db.complaint.count({ where }),
  ]);

  return buildPaginatedResponse(items, take, total);
}

export async function getComplaintStatusCountsForRole(
  userId: string,
  role: Role,
  filters: ComplaintFilters = {},
) {
  const where = buildComplaintWhere(userId, role, filters);

  const [total, pending, inProgress, resolved] = await Promise.all([
    db.complaint.count({ where }),
    db.complaint.count({ where: { ...where, status: "PENDING" } }),
    db.complaint.count({ where: { ...where, status: "IN_PROGRESS" } }),
    db.complaint.count({ where: { ...where, status: "RESOLVED" } }),
  ]);

  return { total, pending, inProgress, resolved };
}

/**
 * Get a single complaint with full relations.
 * Enforces role-based access control.
 */
export async function getComplaintById(
  id: string,
  userId: string,
  role: Role,
) {
  const complaint = await db.complaint.findUnique({
    where: { id, deletedAt: null },
    include: {
      ...complaintInclude,
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        where: role === "USER" ? { isInternal: false } : {},
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      parent: { select: { id: true, title: true } },
      duplicates: { select: { id: true, title: true, status: true } },
    },
  });

  if (!complaint) throw new NotFoundError("Complaint");

  // Users can only view their own complaints
  if (role === "USER" && complaint.userId !== userId) {
    throw new ForbiddenError();
  }

  // Staff can only view complaints in their department or assigned to them
  if (role === "STAFF") {
    const isAssigned = complaint.assignedToId === userId;
    const isInDept = complaint.department
      ? await db.department.findFirst({
          where: { id: complaint.departmentId!, staff: { some: { id: userId } } },
        })
      : null;
    if (!isAssigned && !isInDept) throw new ForbiddenError();
  }

  return complaint;
}

// ============================================
// Mutations
// ============================================

/**
 * Create a new complaint, log activity, compute SLA due date.
 */
export async function createComplaint(
  data: CreateComplaintInput,
  userId: string,
) {
  // Determine SLA due date
  const slaPolicy = await db.sLAPolicy.findFirst({
    where: { category: data.category, priority: data.priority, isActive: true },
  });
  const resolutionHrs = slaPolicy?.resolutionHrs ?? DEFAULT_SLA_HOURS[data.priority];
  const dueDate = getSLADueDate(new Date(), resolutionHrs);

  const lat = typeof data.latitude === "string"
    ? Number.parseFloat(data.latitude as string)
    : (data.latitude ?? null);
  const lng = typeof data.longitude === "string"
    ? Number.parseFloat(data.longitude as string)
    : (data.longitude ?? null);

  return db.$transaction(async (tx) => {
    const complaint = await tx.complaint.create({
      data: {
        title: data.title,
        details: data.details,
        category: data.category,
        priority: data.priority,
        location: data.location ?? null,
        latitude: lat,
        longitude: lng,
        photoUrl: data.photoUrl ?? null,
        departmentId: data.departmentId ?? null,
        dueDate,
        userId,
      },
      include: complaintInclude,
    });

    await tx.complaintActivity.create({
      data: {
        complaintId: complaint.id,
        userId,
        action: ActivityAction.NEW_COMPLAINT,
        comment: "Complaint submitted",
      },
    });

    await tx.notification.create({
      data: {
        userId,
        complaintId: complaint.id,
        title: "Complaint Submitted",
        message: `Your complaint "${complaint.title}" has been received.`,
        type: NotificationType.COMPLAINT_CREATED,
      },
    });

    return complaint;
  });
}

/**
 * Update status/priority/assignment/department with full activity logging.
 */
export async function updateComplaint(
  id: string,
  data: UpdateComplaintInput,
  actorId: string,
  actorRole: Role,
) {
  const existing = await db.complaint.findUnique({
    where: { id, deletedAt: null },
    include: { user: true, department: true },
  });
  if (!existing) throw new NotFoundError("Complaint");

  if (actorRole === "STAFF") {
    const isAssigned = existing.assignedToId === actorId;
    const isInDept = existing.departmentId
      ? await db.department.findFirst({
          where: {
            id: existing.departmentId,
            staff: { some: { id: actorId } },
          },
        })
      : null;

    if (!isAssigned && !isInDept) {
      throw new ForbiddenError(
        "You can only update complaints in your department or assigned to you",
      );
    }

    if (data.assignedToId !== undefined || data.departmentId !== undefined) {
      throw new ForbiddenError(
        "Staff cannot change complaint assignments or departments",
      );
    }
  }

  const activities: Prisma.ComplaintActivityCreateManyInput[] = [];
  const notifications: Prisma.NotificationCreateManyInput[] = [];

  if (data.status && data.status !== existing.status) {
    activities.push({
      complaintId: id,
      userId: actorId,
      action: data.status === "REJECTED"
        ? ActivityAction.REJECTED
        : data.status === "ESCALATED"
          ? ActivityAction.ESCALATED
          : data.status === "RESOLVED"
            ? ActivityAction.RESOLVED
            : ActivityAction.STATUS_CHANGED,
      oldValue: existing.status,
      newValue: data.status,
      comment: `Status changed from ${existing.status} to ${data.status}`,
    });

    const notifType =
      data.status === "RESOLVED"
        ? NotificationType.RESOLVED
        : data.status === "REJECTED"
          ? NotificationType.REJECTED
          : data.status === "ESCALATED"
            ? NotificationType.ESCALATED
            : NotificationType.STATUS_UPDATED;

    notifications.push({
      userId: existing.userId,
      complaintId: id,
      title: `Complaint ${data.status === "RESOLVED" ? "Resolved" : "Status Updated"}`,
      message: `Your complaint "${existing.title}" is now ${data.status.replace("_", " ").toLowerCase()}.`,
      type: notifType,
    });
  }

  if (data.priority && data.priority !== existing.priority) {
    activities.push({
      complaintId: id,
      userId: actorId,
      action: ActivityAction.PRIORITY_CHANGED,
      oldValue: existing.priority,
      newValue: data.priority,
      comment: `Priority changed to ${data.priority}`,
    });
  }

  if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
    const action = existing.assignedToId ? ActivityAction.REASSIGNED : ActivityAction.ASSIGNED;
    activities.push({
      complaintId: id,
      userId: actorId,
      action,
      oldValue: existing.assignedToId,
      newValue: data.assignedToId,
      comment: data.assignedToId ? "Complaint assigned" : "Assignment removed",
    });

    if (data.assignedToId) {
      notifications.push({
        userId: data.assignedToId,
        complaintId: id,
        title: "New Assignment",
        message: `You have been assigned: "${existing.title}"`,
        type: NotificationType.COMPLAINT_ASSIGNED,
      });
    }
  }

  if (data.departmentId !== undefined && data.departmentId !== existing.departmentId) {
    activities.push({
      complaintId: id,
      userId: actorId,
      action: ActivityAction.DEPARTMENT_CHANGED,
      oldValue: existing.departmentId?.toString(),
      newValue: data.departmentId?.toString(),
      comment: "Department changed",
    });
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.status === "RESOLVED" && !existing.resolvedAt && { resolvedAt: new Date() }),
        ...(data.status === "REJECTED" && {
          rejectedAt: new Date(),
          rejectionNote: data.rejectionNote,
        }),
        ...(data.status === "ESCALATED" && { escalatedAt: new Date() }),
      },
      include: complaintInclude,
    });

    if (activities.length > 0) await tx.complaintActivity.createMany({ data: activities });
    if (notifications.length > 0) await tx.notification.createMany({ data: notifications });

    return updated;
  });
}

/**
 * Soft-delete a complaint (ADMIN only — enforce in action).
 */
export async function deleteComplaint(id: string) {
  const complaint = await db.complaint.findUnique({ where: { id } });
  if (!complaint) throw new NotFoundError("Complaint");

  return db.complaint.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Find similar complaints using title text search + proximity.
 * Uses Postgres ILIKE for basic similarity (pg_trgm can be added later via raw query).
 */
export async function findSimilarComplaints(
  title: string,
  latitude?: number | null,
  longitude?: number | null,
) {
  const words = title.trim().split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return [];

  const candidates = await db.complaint.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["RESOLVED", "REJECTED"] },
      OR: words.map((word) => ({
        title: { contains: word, mode: "insensitive" as const },
      })),
    },
    select: {
      id: true,
      title: true,
      status: true,
      category: true,
      latitude: true,
      longitude: true,
      _count: { select: { comments: true } },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  // If location provided, rank by proximity
  if (latitude && longitude) {
    return candidates.sort((a, b) => {
      const distA = a.latitude && a.longitude
        ? Math.hypot(a.latitude - latitude, a.longitude - longitude)
        : Infinity;
      const distB = b.latitude && b.longitude
        ? Math.hypot(b.latitude - latitude, b.longitude - longitude)
        : Infinity;
      return distA - distB;
    });
  }

  return candidates;
}
