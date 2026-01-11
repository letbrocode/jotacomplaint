import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

// Types for incoming payload
interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role?: Role; // ADMIN | STAFF
  isActive?: boolean;
  departmentIds?: number[];
}

// GET - List staff
export async function GET() {
  try {
    const staff = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "STAFF"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 },
    );
  }
}

// POST - Create staff
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = (await req.json()) as CreateStaffPayload;

    const {
      name,
      email,
      password,
      role,
      isActive = true,
      departmentIds = [],
    } = data;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required (min 2 characters)" },
        { status: 400 },
      );
    }

    if (!email?.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Check if already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role ?? "STAFF",
        isActive,
        ...(departmentIds?.length > 0 && {
          departments: {
            connect: departmentIds.map((id) => ({ id })),
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departments: true,
        _count: {
          select: { assignedComplaints: true },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 },
    );
  }
}
