import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { getUserNotifications } from "~/server/services/notification.service";
import { handleApiError } from "~/lib/errors";

// GET - Fetch user's notifications (paginated)
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 20);
    const cursor = searchParams.get("cursor") ?? undefined;

    const result = await getUserNotifications(session.user.id, { take, cursor });
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
