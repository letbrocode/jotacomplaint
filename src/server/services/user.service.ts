import { db } from "~/server/db";
import { NotFoundError, ConflictError, ForbiddenError } from "~/lib/errors";
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

export async function createStaffMember(data: {
  name: string;
  email: string;
  password: string;
  role?: Role;
  isActive?: boolean;
  departmentIds?: number[];
}) {
  const { name, email, password, role, isActive = true, departmentIds = [] } = data;

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ConflictError("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return db.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role ?? "STAFF",
      isActive,
      ...(departmentIds.length > 0 && {
        departments: { connect: departmentIds.map((id) => ({ id })) },
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      departments: true,
      _count: { select: { assignedComplaints: true } },
    },
  });
}

export async function updateStaffMember(
  id: string,
  actorId: string,
  data: {
    name?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
    departmentIds?: number[];
  },
) {
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Staff member");

  const hashedPassword = data.password
    ? await bcrypt.hash(data.password, 10)
    : undefined;

  return db.$transaction(async (tx) => {
    if (Array.isArray(data.departmentIds)) {
      await tx.user.update({ where: { id }, data: { departments: { set: [] } } });
    }
    return tx.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(data.role && { role: data.role }),
        ...(typeof data.isActive === "boolean" && { isActive: data.isActive }),
        ...(Array.isArray(data.departmentIds) && {
          departments: { connect: data.departmentIds.map((did) => ({ id: did })) },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        departments: true,
        _count: { select: { assignedComplaints: true } },
      },
    });
  });
}

export async function deleteStaffMember(id: string, actorId: string) {
  const existing = await db.user.findUnique({
    where: { id },
    include: { _count: { select: { assignedComplaints: true, complaints: true } } },
  });
  if (!existing) throw new NotFoundError("Staff member");
  if (existing.id === actorId) throw new ForbiddenError("You cannot delete your own account");
  if (existing._count.assignedComplaints > 0) {
    throw new Error(
      `Cannot delete staff member with ${existing._count.assignedComplaints} assigned complaint(s). Reassign them first.`,
    );
  }
  if (existing._count.complaints > 0) {
    throw new Error(
      `This user has submitted ${existing._count.complaints} complaint(s). Reassign or delete them first.`,
    );
  }
  return db.user.delete({ where: { id } });
}

export async function deleteUser(id: string) {
  const existing = await db.user.findUnique({
    where: { id },
    include: { _count: { select: { complaints: true } } },
  });
  if (!existing) throw new NotFoundError("User");
  if (existing._count.complaints > 0) {
    throw new Error(
      `Cannot delete user with ${existing._count.complaints} active complaint(s). Resolve or reassign them first.`,
    );
  }
  return db.user.delete({ where: { id } });
}

export async function setUserActiveStatus(id: string, isActive: boolean) {
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("User");
  return db.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      _count: { select: { complaints: true } },
    },
  });
}
