import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "~/server/auth";

export async function GET() {
  try {
    const session = await auth();

    // Only admins can view all staff with details
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const staff = await db.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STAFF"],
        },
      },
      include: {
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assignedComplaints: {
              where: {
                status: {
                  not: "RESOLVED",
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remove passwords from response
    const staffWithoutPasswords = staff.map(
      ({ password: _password, ...user }) => user,
    );

    return NextResponse.json(staffWithoutPasswords);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 },
    );
  }
}
