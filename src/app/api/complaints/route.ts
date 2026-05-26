import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { complaintLimiter, getIpFromRequest } from "~/lib/rate-limit";
import { createComplaintSchema, filterComplaintsSchema } from "~/schemas/complaint.schema";
import {
  createComplaint,
  getComplaintsForRole,
} from "~/server/services/complaint.service";
import { handleApiError } from "~/lib/errors";
import { requireAuth } from "~/lib/auth-guards";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filters = filterComplaintsSchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    const { data, total } = await getComplaintsForRole(
      session.user.id,
      session.user.role,
      filters,
      { take: filters.take, cursor: filters.cursor },
    );

    return NextResponse.json({ data, total });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  // Rate limit: 10 complaint submissions per minute per IP
  const ip = getIpFromRequest(req);
  const { success } = await complaintLimiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute." },
      { status: 429 },
    );
  }

  try {
    const session = await requireAuth();
    const body: unknown = await req.json();
    const data = createComplaintSchema.parse(body);
    const complaint = await createComplaint(data, session.user.id);
    return NextResponse.json(complaint, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
