import { NextResponse } from "next/server";
import { requireRole } from "~/lib/auth-guards";
import { getStaffMembers } from "~/server/services/user.service";
import { handleApiError } from "~/lib/errors";

// GET - List all staff with full details (ADMIN only)
export async function GET() {
  try {
    await requireRole("ADMIN");
    const staff = await getStaffMembers();
    return NextResponse.json(staff);
  } catch (err) {
    return handleApiError(err);
  }
}
