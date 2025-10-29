import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import bcrypt from "bcryptjs";

// GET - Get single staff member
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Only admins can view staff details
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        departments: true,
        _count: {
          select: {
            assignedComplaints: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

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
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Only admins can update staff
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();
    const { name, password, role, isActive, departmentIds } = data;

    // Check if staff member exists
    const existing = await db.user.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Validate name if provided
    if (name && name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }

    // Validate password if provided
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Hash password if provided
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // Update user - handle departments separately due to many-to-many relationship
    const updated = await db.$transaction(async (tx) => {
      // First, disconnect all current departments
      if (departmentIds !== undefined) {
        await tx.user.update({
          where: { id: params.id },
          data: {
            departments: {
              set: [], // Disconnect all
            },
          },
        });
      }

      // Then update user with new data
      const user = await tx.user.update({
        where: { id: params.id },
        data: {
          ...(name && { name: name.trim() }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(role && { role }),
          ...(isActive !== undefined && { isActive }),
          ...(departmentIds !== undefined && {
            departments: {
              connect: departmentIds.map((id: number) => ({ id })),
            },
          }),
        },
        include: {
          departments: true,
          _count: {
            select: {
              assignedComplaints: true,
            },
          },
        },
      });

      return user;
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updated;

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
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Only admins can delete staff
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if staff member exists
    const existing = await db.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            assignedComplaints: true,
            complaints: true, // User-submitted complaints
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

    // Prevent deleting yourself
    if (existing.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    // Prevent deletion if staff has assigned complaints
    if (existing._count.assignedComplaints > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete staff member with ${existing._count.assignedComplaints} assigned complaint(s). Reassign them first.`,
        },
        { status: 400 },
      );
    }

    // Note: User-submitted complaints will be cascade deleted due to schema
    // You may want to reassign these instead
    if (existing._count.complaints > 0) {
      return NextResponse.json(
        {
          error: `This user has submitted ${existing._count.complaints} complaint(s). These will be deleted. Are you sure?`,
        },
        { status: 400 },
      );
    }

    await db.user.delete({
      where: { id: params.id },
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
