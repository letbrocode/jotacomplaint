import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

type StaffPatchDTO = {
  name?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
  departmentIds?: number[];
};

// GET - Get single staff member
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id: id },
      include: {
        departments: true,
        _count: {
          select: { assignedComplaints: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    const { password: _removed, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching staff member:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 },
    );
  }
}

// PATCH - Update staff member
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await req.json()) as StaffPatchDTO;
    const { name, password, role, isActive, departmentIds } = body;

    const existing = await db.user.findUnique({
      where: { id: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Validations
    if (typeof name === "string" && name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (typeof password === "string" && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // Update in transaction
    const updated = await db.$transaction(async (tx) => {
      if (Array.isArray(departmentIds)) {
        await tx.user.update({
          where: { id: id },
          data: { departments: { set: [] } },
        });
      }

      const user = await tx.user.update({
        where: { id: id },
        data: {
          ...(typeof name === "string" && { name: name.trim() }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(typeof role === "string" && { role }),
          ...(typeof isActive === "boolean" && { isActive }),
          ...(Array.isArray(departmentIds) && {
            departments: {
              connect: departmentIds.map((id) => ({ id })),
            },
          }),
        },
        include: {
          departments: true,
          _count: {
            select: { assignedComplaints: true },
          },
        },
      });

      return user;
    });

    const { password: _removed, ...userWithoutPassword } = updated;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating staff member:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 },
    );
  }
}

// DELETE - Delete staff member
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.user.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            assignedComplaints: true,
            complaints: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    if (existing.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    if (existing._count.assignedComplaints > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete staff member with ${existing._count.assignedComplaints} assigned complaint(s). Reassign them first.`,
        },
        { status: 400 },
      );
    }

    if (existing._count.complaints > 0) {
      return NextResponse.json(
        {
          error: `This user has submitted ${existing._count.complaints} complaint(s). These will be deleted. Are you sure?`,
        },
        { status: 400 },
      );
    }

    await db.user.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 },
    );
  }
}
