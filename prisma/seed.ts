import {
  PrismaClient,
  Role,
  Status,
  Priority,
  ComplaintCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (optional for dev)
  await prisma.complaint.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // ---- Departments ----
  const departments = await prisma.department.createMany({
    data: [
      {
        name: "Water Department",
        description: "Handles water supply and related complaints.",
      },
      {
        name: "Electricity Department",
        description: "Handles electrical issues and outages.",
      },
      {
        name: "Sanitation Department",
        description: "Handles garbage and sanitation complaints.",
      },
      {
        name: "Roads Department",
        description: "Handles road and infrastructure complaints.",
      },
    ],
  });

  const allDepartments = await prisma.department.findMany();

  // ---- Admin User ----
  const adminPassword = await bcrypt.hash("12345678", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // ---- Department Staff ----
  const staffPassword = await bcrypt.hash("12345678", 10);
  const staffUsers = await Promise.all(
    allDepartments.map((dept) =>
      prisma.user.create({
        data: {
          name: `${dept.name.replace(" Department", "")} Staff`,
          email: `${dept.name.split(" ")[0]?.toLowerCase()}@example.com`,
          password: staffPassword,
          role: Role.USER,
          departments: { connect: { id: dept.id } },
        },
      }),
    ),
  );

  // ---- Normal User ----
  const userPassword = await bcrypt.hash("12345678", 10);
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: userPassword,
      role: Role.USER,
    },
  });

  // ---- Complaints ----
  await prisma.complaint.createMany({
    data: [
      {
        title: "Leaking water pipeline near park",
        details: "There is a leakage near Sector 4 Park causing water wastage.",
        category: ComplaintCategory.WATER,
        location: "Sector 4 Park",
        priority: Priority.HIGH,
        status: Status.PENDING,
        userId: user.id,
        departmentId: allDepartments.find((d) => d.name.includes("Water"))?.id,
      },
      {
        title: "Street light not working",
        details: "Main road lights are off since two days.",
        category: ComplaintCategory.ELECTRICITY,
        location: "Main Road, Sector 8",
        priority: Priority.MEDIUM,
        status: Status.IN_PROGRESS,
        userId: user.id,
        departmentId: allDepartments.find((d) => d.name.includes("Electricity"))
          ?.id,
      },
      {
        title: "Overflowing garbage bins",
        details: "The bins are overflowing near the market.",
        category: ComplaintCategory.SANITATION,
        location: "Central Market",
        priority: Priority.LOW,
        status: Status.RESOLVED,
        userId: user.id,
        departmentId: allDepartments.find((d) => d.name.includes("Sanitation"))
          ?.id,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
