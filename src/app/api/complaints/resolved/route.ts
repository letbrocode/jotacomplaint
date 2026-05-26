import { NextResponse } from "next/server";
import { requireRole } from "~/lib/auth-guards";
import { getComplaintsForRole } from "~/server/services/complaint.service";
import { handleApiError } from "~/lib/errors";

// GET - Fetch resolved complaints (ADMIN and STAFF only)
export async function GET(req: Request) {
  try {
    const session = await requireRole("ADMIN", "STAFF");
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 50);

    const { data } = await getComplaintsForRole(
      session.user.id,
      session.user.role,
      { status: "RESOLVED" },
      { take },
    );

    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
