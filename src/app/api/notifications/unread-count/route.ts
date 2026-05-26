import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { getUnreadCount } from "~/server/services/notification.service";

// GET - Get unread notification count
// Returns { count: 0 } on any error or unauthenticated state — never throws,
// since this is polled frequently by the client.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }
    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
