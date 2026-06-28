import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { handleApiError } from "~/lib/errors";
import { apiLimiter, getIpFromRequest } from "~/lib/rate-limit";
import { presignUploadSchema } from "~/schemas/upload.schema";
import { createComplaintUploadUrl } from "~/server/storage/s3.service";

export async function POST(req: Request) {
  const ip = getIpFromRequest(req);
  const { success } = await apiLimiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const session = await requireAuth();
    const body: unknown = await req.json();
    const data = presignUploadSchema.parse(body);
    const upload = await createComplaintUploadUrl({
      ...data,
      userId: session.user.id,
    });

    return NextResponse.json(upload);
  } catch (err) {
    return handleApiError(err);
  }
}
