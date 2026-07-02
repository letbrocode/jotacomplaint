import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { handleApiError } from "~/lib/errors";
import { apiLimiter, getIpFromRequest } from "~/lib/rate-limit";
import { logger } from "~/lib/logger";
import { presignUploadSchema } from "~/schemas/upload.schema";
import { createComplaintUploadUrl } from "~/server/storage/s3.service";

export async function POST(req: Request) {
  const ip = getIpFromRequest(req);
  // Fail-open on Upstash outage (AGENTS.md §6): a Redis blip must not block uploads.
  try {
    const { success } = await apiLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }
  } catch {
    logger.warn({ ip }, "Rate limiter unavailable for presign route — failing open");
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
