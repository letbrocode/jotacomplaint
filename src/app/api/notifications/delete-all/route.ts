import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { deleteAllNotifications } from "~/server/services/notification.service";
import { handleApiError } from "~/lib/errors";

// DELETE - Delete all user's notifications
export async function DELETE() {
  try {
    const session = await requireAuth();
    await deleteAllNotifications(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
