import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { markAllNotificationsRead } from "~/server/services/notification.service";
import { handleApiError } from "~/lib/errors";

// PATCH - Mark all notifications as read
export async function PATCH() {
  try {
    const session = await requireAuth();
    await markAllNotificationsRead(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
