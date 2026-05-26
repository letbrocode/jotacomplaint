import { NextResponse } from "next/server";
import { requireRole } from "~/lib/auth-guards";
import { getAllUsers } from "~/server/services/user.service";
import { handleApiError } from "~/lib/errors";

// GET - List all regular users (ADMIN only)
export async function GET() {
  try {
    await requireRole("ADMIN");
    const { data } = await getAllUsers({ role: "USER" });
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
