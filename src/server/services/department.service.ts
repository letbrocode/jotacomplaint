import { db } from "~/server/db";
import { NotFoundError } from "~/lib/errors";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "~/schemas/department.schema";

// ============================================
// Department Service
// ============================================

export async function getAllDepartments(includeInactive = false) {
  return db.department.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: { select: { staff: true, complaints: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDepartmentById(id: number) {
  const dept = await db.department.findUnique({
    where: { id },
    include: {
      staff: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
        where: { isActive: true },
      },
      complaints: {
        where: { deletedAt: null },
        select: { status: true },
      },
      _count: { select: { staff: true, complaints: true } },
    },
  });
  if (!dept) throw new NotFoundError("Department");
  return dept;
}

export async function getDepartmentsWithStats() {
  const departments = await db.department.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { staff: true } },
      complaints: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return departments.map((dept) => ({
    ...dept,
    stats: {
      total: dept.complaints.length,
      pending: dept.complaints.filter((c) => c.status === "PENDING").length,
      inProgress: dept.complaints.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: dept.complaints.filter((c) => c.status === "RESOLVED").length,
    },
  }));
}

export async function createDepartment(data: CreateDepartmentInput) {
  return db.department.create({ data });
}

export async function updateDepartment(id: number, data: UpdateDepartmentInput) {
  const dept = await db.department.findUnique({ where: { id } });
  if (!dept) throw new NotFoundError("Department");
  return db.department.update({ where: { id }, data });
}

export async function addStaffToDepartment(deptId: number, userId: string) {
  const dept = await db.department.findUnique({ where: { id: deptId } });
  if (!dept) throw new NotFoundError("Department");
  return db.department.update({
    where: { id: deptId },
    data: { staff: { connect: { id: userId } } },
  });
}

export async function removeStaffFromDepartment(deptId: number, userId: string) {
  const dept = await db.department.findUnique({ where: { id: deptId } });
  if (!dept) throw new NotFoundError("Department");
  return db.department.update({
    where: { id: deptId },
    data: { staff: { disconnect: { id: userId } } },
  });
}
