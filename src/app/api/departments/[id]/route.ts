import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

type UpdateDepartmentBody = {
  name?: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

// GET - Get single department
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const departmentId = Number(id);

    if (Number.isNaN(departmentId)) {
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const departmentId = Number(id);

    if (Number.isNaN(departmentId)) {
      return NextResponse.json(
        { error: "Invalid department ID" },
        { status: 400 },
      );
    }

    const data = (await req.json()) as UpdateDepartmentBody;
    const { name, description, email, phone, isActive } = data;

    if (name && name.trim().length < 3) {
      return NextResponse.json(
        { error: "Department name must be at least 3 characters" },
        { status: 400 },
      );
    }

    const existing = await db.department.findUnique({
      where: { id: departmentId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    if (name && name.trim() !== existing.name) {
      const conflict = await db.department.findUnique({
        where: { name: name.trim() },
      });

      if (conflict) {
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
        description: description?.trim() ?? null,
        email: email?.trim() ?? null,
        phone: phone?.trim() ?? null,
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const departmentId = Number(id);

    if (Number.isNaN(departmentId)) {
      return NextResponse.json(
        { error: "Invalid department ID" },
        { status: 400 },
      );
    }

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
