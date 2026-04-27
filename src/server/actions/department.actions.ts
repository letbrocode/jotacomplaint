"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "~/lib/auth-guards";
import { actionOk, actionErr } from "~/lib/api";
import { createDepartmentSchema, updateDepartmentSchema } from "~/schemas/department.schema";
import {
  createDepartment,
  updateDepartment,
  addStaffToDepartment,
  removeStaffFromDepartment,
} from "~/server/services/department.service";

// ============================================
// Department Server Actions (ADMIN only)
// ============================================

export async function createDepartmentAction(raw: unknown) {
  try {
    await requireRole("ADMIN");
    const data = createDepartmentSchema.parse(raw);
    const dept = await createDepartment(data);
    revalidatePath("/admin/departments");
    return actionOk(dept);
  } catch (err) {
    return actionErr(err);
  }
}

export async function updateDepartmentAction(id: number, raw: unknown) {
  try {
    await requireRole("ADMIN");
    const data = updateDepartmentSchema.parse(raw);
    const dept = await updateDepartment(id, data);
    revalidatePath("/admin/departments");
    return actionOk(dept);
  } catch (err) {
    return actionErr(err);
  }
}

export async function addStaffAction(deptId: number, userId: string) {
  try {
    await requireRole("ADMIN");
    await addStaffToDepartment(deptId, userId);
    revalidatePath("/admin/departments");
    revalidatePath("/admin/staff");
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}

export async function removeStaffAction(deptId: number, userId: string) {
  try {
    await requireRole("ADMIN");
    await removeStaffFromDepartment(deptId, userId);
    revalidatePath("/admin/departments");
    revalidatePath("/admin/staff");
    return actionOk(undefined);
  } catch (err) {
    return actionErr(err);
  }
}
