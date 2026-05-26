import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "~/lib/auth-guards";
import { setUserActiveStatus, deleteUser } from "~/server/services/user.service";
import { handleApiError } from "~/lib/errors";

const patchUserSchema = z.object({
  isActive: z.boolean(),
});

// PATCH - Toggle user active status (ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body: unknown = await req.json();
    const { isActive } = patchUserSchema.parse(body);
    const user = await setUserActiveStatus(id, isActive);
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE - Delete a user (ADMIN only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
