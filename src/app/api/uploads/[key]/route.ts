import { NextResponse } from "next/server";
import { requireAuth } from "~/lib/auth-guards";
import { handleApiError } from "~/lib/errors";
import {
  deleteComplaintObject,
  parseAndValidateKey,
} from "~/server/storage/s3.service";

/**
 * DELETE /api/uploads/[key]
 *
 * Deletes an S3 object that was presigned but never committed to the DB —
 * i.e. the user uploaded a photo then removed it or abandoned the form.
 *
 * Security: parseAndValidateKey enforces that the key prefix matches the
 * authenticated user's ID, preventing IDOR (one user deleting another's object).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const session = await requireAuth();
    const { key: rawKey } = await params;
    const key = parseAndValidateKey(rawKey, session.user.id);
    await deleteComplaintObject(key);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
