import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

// GET - Get single department
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const departmentId = parseInt(params.id);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: "Invalid department ID" },
        { status: 400 },
      );
    }

    const department = await db.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            complaints: true,
            staff: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 },
    );
  }
}

// PATCH - Update department
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Only admins can update departments
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const departmentId = parseInt(params.id);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: "Invalid department ID" },
        { status: 400 },
      );
    }

    const data = await req.json();
    const { name, description, email, phone, isActive } = data;

    // Validate name if provided
    if (name && name.trim().length < 3) {
      return NextResponse.json(
        { error: "Department name must be at least 3 characters" },
        { status: 400 },
      );
    }

    // Check if department exists
    const existing = await db.department.findUnique({
      where: { id: departmentId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    // Check for name conflicts if name is being changed
    if (name && name.trim() !== existing.name) {
      const nameConflict = await db.department.findUnique({
        where: { name: name.trim() },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "A department with this name already exists" },
          { status: 409 },
        );
      }
    }

    const updated = await db.department.update({
      where: { id: departmentId },
      data: {
        ...(name && { name: name.trim() }),
        description: description?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: {
            complaints: true,
            staff: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 },
    );
  }
}

// DELETE - Delete department
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Only admins can delete departments
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const departmentId = parseInt(params.id);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: "Invalid department ID" },
        { status: 400 },
      );
    }

    // Check if department exists
    const existing = await db.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            complaints: true,
            staff: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    // Prevent deletion if department has active complaints or staff
    if (existing._count.complaints > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department with ${existing._count.complaints} active complaint(s). Reassign or resolve them first.`,
        },
        { status: 400 },
      );
    }

    if (existing._count.staff > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department with ${existing._count.staff} staff member(s). Reassign them first.`,
        },
        { status: 400 },
      );
    }

    await db.department.delete({
      where: { id: departmentId },
    });

    return NextResponse.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 },
    );
  }
}
