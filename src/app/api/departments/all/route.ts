import { NextResponse } from "next/server";
import { requireRole } from "~/lib/auth-guards";
import { getAllDepartments } from "~/server/services/department.service";
import { handleApiError } from "~/lib/errors";

// GET - List all departments including inactive ones (ADMIN only)
export async function GET() {
  try {
    await requireRole("ADMIN");
    const departments = await getAllDepartments(true); // includeInactive = true
    return NextResponse.json(departments);
  } catch (err) {
    return handleApiError(err);
  }
}
