import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { deleteNotification } from "~/server/services/notification.service";
import { handleApiError } from "~/lib/errors";

// DELETE - Delete a notification
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await deleteNotification(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
