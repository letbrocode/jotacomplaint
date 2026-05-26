import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { markNotificationRead } from "~/server/services/notification.service";
import { handleApiError } from "~/lib/errors";

// PATCH - Mark notification as read
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const updated = await markNotificationRead(id, session.user.id);
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
