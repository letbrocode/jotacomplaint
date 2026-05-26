import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "~/lib/auth-guards";
import { getUserById, updateStaffMember, deleteStaffMember } from "~/server/services/user.service";
import { handleApiError } from "~/lib/errors";
import type { Role } from "@prisma/client";

const updateStaffSchema = z.object({
  name: z.string().min(2).trim().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
  departmentIds: z.array(z.number().int().positive()).optional(),
});

// GET - Get single staff member (ADMIN only)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const user = await getUserById(id);
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH - Update staff member (ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;
    const body: unknown = await req.json();
    const data = updateStaffSchema.parse(body);
    const updated = await updateStaffMember(id, session.user.id, {
      ...data,
      role: data.role as Role | undefined,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE - Delete staff member (ADMIN only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;
    await deleteStaffMember(id, session.user.id);
    return NextResponse.json({ success: true, message: "Staff member deleted successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
