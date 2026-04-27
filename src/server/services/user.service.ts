import { db } from "~/server/db";
import { NotFoundError } from "~/lib/errors";
import bcrypt from "bcryptjs";
import type { UpdateProfileInput } from "~/schemas/user.schema";
import type { Role } from "@prisma/client";
import { buildCursorQuery, buildPaginatedResponse, type PaginationParams } from "~/lib/pagination";

// ============================================
// User Service
// ============================================

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  phone: true,
  avatar: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
  emailOnCreated: true,
  emailOnAssigned: true,
  emailOnStatusUpdate: true,
  emailOnResolved: true,
} as const;

export async function getUserById(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: userPublicSelect,
  });
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function getAllUsers(
  filters: { role?: Role; isActive?: boolean; search?: string } = {},
  pagination: PaginationParams = {},
) {
  const { role, isActive, search } = filters;
  const take = pagination.take ?? 20;
  const cursorQuery = buildCursorQuery(pagination);

  const where = {
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        ...userPublicSelect,
        _count: { select: { complaints: true, assignedComplaints: true } },
      },
      orderBy: { createdAt: "desc" },
      ...cursorQuery,
    }),
    db.user.count({ where }),
  ]);

  return buildPaginatedResponse(items, take, total);
}

export async function getStaffMembers(departmentId?: number) {
  return db.user.findMany({
    where: {
      role: { in: ["STAFF", "ADMIN"] },
      isActive: true,
      ...(departmentId
        ? { departments: { some: { id: departmentId } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departments: { select: { id: true, name: true } },
      _count: { select: { assignedComplaints: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function updateUserProfile(id: string, data: UpdateProfileInput) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");
  return db.user.update({
    where: { id },
    data,
    select: userPublicSelect,
  });
}

export async function changeUserPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");

  if (!user.password || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new Error("Current password is incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  return db.user.update({ where: { id }, data: { password: hashed } });
}

export async function deactivateUser(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");
  return db.user.update({ where: { id }, data: { isActive: false } });
}
