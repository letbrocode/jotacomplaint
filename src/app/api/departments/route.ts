import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

type CreateDepartmentBody = {
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

// GET - List active departments (for dropdowns)
export async function GET() {
  try {
    const departments = await db.department.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 },
    );
  }
}

// POST - Create new department
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = (await req.json()) as CreateDepartmentBody;
    const { name, description, email, phone, isActive } = data;

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Department name is required (min 3 characters)" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    const existing = await db.department.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 409 },
      );
    }

    const department = await db.department.create({
      data: {
        name: trimmedName,
        description: description?.trim() ?? null,
        email: email?.trim() ?? null,
        phone: phone?.trim() ?? null,
        isActive: isActive ?? true,
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

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 },
    );
  }
}
