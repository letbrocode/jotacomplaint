import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "~/lib/auth-guards";
import { getStaffMembers, createStaffMember } from "~/server/services/user.service";
import { handleApiError } from "~/lib/errors";
import type { Role } from "@prisma/client";

const createStaffSchema = z.object({
  name: z.string().min(2, "Name is required (min 2 characters)").trim(),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
  departmentIds: z.array(z.number().int().positive()).optional(),
});

// GET - List staff members
export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId")
      ? Number(searchParams.get("departmentId"))
      : undefined;
    const staff = await getStaffMembers(departmentId);
    return NextResponse.json(staff);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST - Create staff member (ADMIN only)
export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
    const body: unknown = await req.json();
    const data = createStaffSchema.parse(body);
    const user = await createStaffMember({
      ...data,
      role: data.role as Role | undefined,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
