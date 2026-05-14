import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { apiLimiter, getIpFromRequest } from "~/lib/rate-limit";
import { updateComplaintSchema } from "~/schemas/complaint.schema";
import { updateComplaint, getComplaintById } from "~/server/services/complaint.service";
import { handleApiError } from "~/lib/errors";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Rate limit ─────────────────────────────────────────────
  const ip = getIpFromRequest(req);
  const { success } = await apiLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();

  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const json = await req.json();
    const data = updateComplaintSchema.parse(json);

    const updated = await updateComplaint(
      id,
      data,
      session.user.id,
      session.user.role,
    );

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const complaint = await getComplaintById(id, session.user.id, session.user.role);

    return NextResponse.json(complaint);
  } catch (err) {
    return handleApiError(err);
  }
}
