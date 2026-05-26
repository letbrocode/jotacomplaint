import { NextResponse } from "next/server";
import { requireRole } from "~/lib/auth-guards";
import { updateDepartmentSchema } from "~/schemas/department.schema";
import {
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "~/server/services/department.service";
import { handleApiError } from "~/lib/errors";

// GET - Get single department
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const departmentId = Number(id);
    if (Number.isNaN(departmentId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }
    const department = await getDepartmentById(departmentId);
    return NextResponse.json(department);
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH - Update department (ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const departmentId = Number(id);
    if (Number.isNaN(departmentId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }
    const body: unknown = await req.json();
    const data = updateDepartmentSchema.parse(body);
    const updated = await updateDepartment(departmentId, data);
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE - Delete department (ADMIN only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const departmentId = Number(id);
    if (Number.isNaN(departmentId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }
    await deleteDepartment(departmentId);
    return NextResponse.json({ success: true, message: "Department deleted successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
