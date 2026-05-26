import { NextResponse } from "next/server";
import { requireRole } from "~/lib/auth-guards";
import { createDepartmentSchema } from "~/schemas/department.schema";
import { getAllDepartments, createDepartment } from "~/server/services/department.service";
import { handleApiError, ConflictError } from "~/lib/errors";

// GET - List active departments (for dropdowns and admin pages)
export async function GET() {
  try {
    const departments = await getAllDepartments();
    return NextResponse.json(departments);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST - Create new department (ADMIN only)
export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
    const body: unknown = await req.json();
    const data = createDepartmentSchema.parse(body);
    const department = await createDepartment(data);
    return NextResponse.json(department, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return handleApiError(new ConflictError("A department with this name already exists"));
    }
    return handleApiError(err);
  }
}
