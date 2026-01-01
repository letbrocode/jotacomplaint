import {
  PrismaClient,
  Role,
  Status,
  Priority,
  ComplaintCategory,
  ActivityAction,
  NotificationType,
  LocationType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper function to generate nearby coordinates
function generateNearbyCoord(
  baseLat: number,
  baseLng: number,
  radiusKm: number = 2,
): { lat: number; lng: number } {
  const latOffset = (Math.random() - 0.5) * (radiusKm / 55.5);
  const lngOffset = (Math.random() - 0.5) * (radiusKm / 55.5);
  return {
    lat: parseFloat((baseLat + latOffset).toFixed(6)),
    lng: parseFloat((baseLng + lngOffset).toFixed(6)),
  };
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data in correct order (children first)
  await prisma.notification.deleteMany();
  await prisma.complaintActivity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.publicLocation.deleteMany();

  console.log("✅ Cleared existing data");

  // ============================================
  // DEPARTMENTS
  // ============================================
  const departmentData = [
    {
      name: "Water Department",
      description: "Handles water supply, drainage, and sewage complaints.",
      email: "water@municipality.gov",
      phone: "+91-1234-567890",
    },
    {
      name: "Electricity Department",
      description:
        "Manages electrical issues, power outages, and street lighting.",
      email: "electricity@municipality.gov",
      phone: "+91-1234-567891",
    },
    {
      name: "Sanitation Department",
      description:
        "Oversees waste management, garbage collection, and cleanliness.",
      email: "sanitation@municipality.gov",
      phone: "+91-1234-567892",
    },
    {
      name: "Roads Department",
      description: "Maintains roads, bridges, and traffic infrastructure.",
      email: "roads@municipality.gov",
      phone: "+91-1234-567893",
    },
    {
      name: "Public Works",
      description: "General infrastructure and public facility maintenance.",
      email: "public@municipality.gov",
      phone: "+91-1234-567894",
    },
  ];

  await prisma.department.createMany({ data: departmentData });
  const allDepartments = await prisma.department.findMany();
  console.log(`✅ Created ${allDepartments.length} departments`);

  // ============================================
  // ADMIN USER
  // ============================================
  const adminPassword = await bcrypt.hash("12345678", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin Manager",
      email: "admin@municipality.gov",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Created admin user");

  // ============================================
  // STAFF USERS
  // ============================================
  const staffPassword = await bcrypt.hash("12345678", 10);
  const staffUsers: { [key: number]: string[] } = {};

  for (const dept of allDepartments) {
    const staff1 = await prisma.user.create({
      data: {
        name: `${dept.name.split(" ")[0]} Officer`,
        email: `${dept.name.split(" ")[0]?.toLowerCase()}.officer@municipality.gov`,
        password: staffPassword,
        role: Role.STAFF,
        departments: { connect: { id: dept.id } },
      },
    });

    const staff2 = await prisma.user.create({
      data: {
        name: `${dept.name.split(" ")[0]} Supervisor`,
        email: `${dept.name.split(" ")[0]?.toLowerCase()}.supervisor@municipality.gov`,
        password: staffPassword,
        role: Role.STAFF,
        departments: { connect: { id: dept.id } },
      },
    });

    staffUsers[dept.id] = [staff1.id, staff2.id];
  }
  console.log(
    `✅ Created ${Object.values(staffUsers).flat().length} staff users`,
  );

  // ============================================
  // REGULAR USERS
  // ============================================
  const userPassword = await bcrypt.hash("12345678", 10);
  const regularUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@gmail.com",
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Sharma",
        email: "priya.sharma@gmail.com",
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Amit Patel",
        email: "amit.patel@yahoo.com",
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sneha Reddy",
        email: "sneha.reddy@outlook.com",
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Vikram Singh",
        email: "vikram.singh@gmail.com",
        password: userPassword,
        role: Role.USER,
      },
    }),
  ]);
  console.log(`✅ Created ${regularUsers.length} regular users`);

  // ============================================
  // PUBLIC LOCATIONS (GARBAGE BINS, ETC.)
  // ============================================
  await prisma.publicLocation.createMany({
    data: [
      // Dadar area
      {
        name: "Dadar Station Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.0176,
        longitude: 72.8462,
        description: "Near Dadar Railway Station",
      },
      {
        name: "Shivaji Park Collection Point",
        type: LocationType.COLLECTION_POINT,
        latitude: 19.027,
        longitude: 72.8394,
        description: "Main collection point for Shivaji Park area",
      },
      // Bandra area
      {
        name: "Bandra West Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.0596,
        longitude: 72.8295,
        description: "Linking Road area",
      },
      {
        name: "Bandra Reclamation Dump Site",
        type: LocationType.DUMP_SITE,
        latitude: 19.065,
        longitude: 72.835,
        description: "Primary dump site for Bandra",
      },
      // Andheri area
      {
        name: "Andheri East Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.1136,
        longitude: 72.8697,
        description: "Near Metro Station",
      },
      {
        name: "Andheri Collection Point",
        type: LocationType.COLLECTION_POINT,
        latitude: 19.1197,
        longitude: 72.8464,
        description: "Western Express Highway",
      },
      // Worli area
      {
        name: "Worli Sea Face Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.0134,
        longitude: 72.8184,
        description: "Near Worli Sea Face",
      },
      // Colaba area
      {
        name: "Colaba Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 18.9067,
        longitude: 72.8147,
        description: "Colaba Causeway area",
      },
      {
        name: "Gateway Collection Point",
        type: LocationType.COLLECTION_POINT,
        latitude: 18.922,
        longitude: 72.8347,
        description: "Near Gateway of India",
      },
      // Powai area
      {
        name: "Powai Lake Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.1197,
        longitude: 72.9059,
        description: "Powai Lake vicinity",
      },
      {
        name: "Powai Dump Site",
        type: LocationType.DUMP_SITE,
        latitude: 19.13,
        longitude: 72.91,
        description: "Main dump site for Powai area",
      },
      // Borivali area
      {
        name: "Borivali West Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.2403,
        longitude: 72.8492,
        description: "Borivali West market area",
      },
      {
        name: "Borivali National Park Collection",
        type: LocationType.COLLECTION_POINT,
        latitude: 19.235,
        longitude: 72.855,
        description: "Near National Park entrance",
      },
      // Kurla area
      {
        name: "Kurla LBS Marg Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.0728,
        longitude: 72.8826,
        description: "LBS Marg area",
      },
      // Malad area
      {
        name: "Malad West Garbage Bin",
        type: LocationType.GARBAGE_BIN,
        latitude: 19.1864,
        longitude: 72.8493,
        description: "Near Malad Station",
      },
    ],
  });

  const publicLocations = await prisma.publicLocation.findMany();
  console.log(`✅ Created ${publicLocations.length} public locations`);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const randomElement = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)]!;

  const randomPastDate = (daysAgo: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    return date;
  };

  const addRandomTime = (baseDate: Date, maxHours: number): Date => {
    return new Date(
      baseDate.getTime() + Math.random() * maxHours * 60 * 60 * 1000,
    );
  };

  // ============================================
  // DETAILED COMPLAINT TEMPLATES WITH COORDINATES
  // ============================================
  const complaintTemplates = [
    // WATER COMPLAINTS
    {
      title: "Severe water leakage on Main Street",
      details:
        "There is a major water pipeline burst near the intersection causing significant water wastage. The road is flooded and traffic is affected.",
      category: ComplaintCategory.WATER,
      location: "Dadar Main Road, near Railway Station",
      priority: Priority.HIGH,
      status: Status.IN_PROGRESS,
      departmentName: "Water Department",
      latitude: 19.0176,
      longitude: 72.8462,
    },
    {
      title: "No water supply for 3 days",
      details:
        "Our locality hasn't received any water supply for the past 3 days. Many households are facing severe issues.",
      category: ComplaintCategory.WATER,
      location: "Bandra West, Linking Road Area",
      priority: Priority.HIGH,
      status: Status.PENDING,
      departmentName: "Water Department",
      latitude: 19.0596,
      longitude: 72.8295,
    },
    {
      title: "Dirty water supply",
      details:
        "The water coming from taps is brownish and has a foul smell. Not suitable for drinking or cooking.",
      category: ComplaintCategory.WATER,
      location: "Nehru Nagar, Kurla East",
      priority: Priority.MEDIUM,
      status: Status.PENDING,
      departmentName: "Water Department",
      latitude: 19.0728,
      longitude: 72.8826,
    },
    {
      title: "Water meter not working",
      details:
        "The water meter installed at my residence has stopped working and shows incorrect readings.",
      category: ComplaintCategory.WATER,
      location: "Worli Sea Face, Tower 3",
      priority: Priority.LOW,
      status: Status.RESOLVED,
      departmentName: "Water Department",
      latitude: 19.0134,
      longitude: 72.8184,
    },
    {
      title: "Low water pressure",
      details:
        "Water pressure is extremely low on upper floors. Takes hours to fill overhead tank.",
      category: ComplaintCategory.WATER,
      location: "Andheri West, JP Road",
      priority: Priority.MEDIUM,
      status: Status.IN_PROGRESS,
      departmentName: "Water Department",
      latitude: 19.1136,
      longitude: 72.8697,
    },

    // ELECTRICITY COMPLAINTS
    {
      title: "Frequent power cuts in our area",
      details:
        "We are experiencing power outages 4-5 times daily, each lasting 1-2 hours. This is affecting work from home and children's online classes.",
      category: ComplaintCategory.ELECTRICITY,
      location: "Malad East, Kurar Village",
      priority: Priority.HIGH,
      status: Status.PENDING,
      departmentName: "Electricity Department",
      latitude: 19.1864,
      longitude: 72.8493,
    },
    {
      title: "Street lights not working",
      details:
        "All street lights on our road have been non-functional for over a week, creating safety concerns.",
      category: ComplaintCategory.ELECTRICITY,
      location: "Goregaon East, Film City Road",
      priority: Priority.MEDIUM,
      status: Status.IN_PROGRESS,
      departmentName: "Electricity Department",
      latitude: 19.1702,
      longitude: 72.8494,
    },
    {
      title: "Exposed electrical wires",
      details:
        "Live electrical wires are hanging dangerously low near the playground. This is a serious safety hazard.",
      category: ComplaintCategory.ELECTRICITY,
      location: "Powai Garden Complex",
      priority: Priority.HIGH,
      status: Status.IN_PROGRESS,
      departmentName: "Electricity Department",
      latitude: 19.1197,
      longitude: 72.9059,
    },
    {
      title: "Electric pole damaged",
      details:
        "An electric pole was damaged during yesterday's storm and is leaning dangerously.",
      category: ComplaintCategory.ELECTRICITY,
      location: "Borivali West, IC Colony",
      priority: Priority.HIGH,
      status: Status.RESOLVED,
      departmentName: "Electricity Department",
      latitude: 19.2403,
      longitude: 72.8492,
    },
    {
      title: "Voltage fluctuation issues",
      details:
        "Severe voltage fluctuations have damaged several electronic appliances in our neighborhood.",
      category: ComplaintCategory.ELECTRICITY,
      location: "Vikhroli West, Godrej Hills",
      priority: Priority.MEDIUM,
      status: Status.PENDING,
      departmentName: "Electricity Department",
      latitude: 19.111,
      longitude: 72.925,
    },

    // SANITATION COMPLAINTS
    {
      title: "Garbage not collected for a week",
      details:
        "Municipal garbage collection has not happened in our area for the past 7 days. The pile is creating health hazards.",
      category: ComplaintCategory.SANITATION,
      location: "Dadar Market Area",
      priority: Priority.HIGH,
      status: Status.PENDING,
      departmentName: "Sanitation Department",
      latitude: 19.019,
      longitude: 72.8445,
    },
    {
      title: "Overflowing garbage bins",
      details:
        "The community garbage bins are overflowing and attracting stray animals and insects.",
      category: ComplaintCategory.SANITATION,
      location: "Bandra Reclamation",
      priority: Priority.MEDIUM,
      status: Status.RESOLVED,
      departmentName: "Sanitation Department",
      latitude: 19.0565,
      longitude: 72.8255,
    },
    {
      title: "Open drain needs cleaning",
      details:
        "The open drain in our street is clogged and emitting foul smell. Mosquito breeding is visible.",
      category: ComplaintCategory.SANITATION,
      location: "LBS Marg, Kurla West",
      priority: Priority.MEDIUM,
      status: Status.IN_PROGRESS,
      departmentName: "Sanitation Department",
      latitude: 19.0755,
      longitude: 72.8795,
    },
    {
      title: "Illegal dumping of waste",
      details:
        "Someone is illegally dumping construction waste near the park entrance.",
      category: ComplaintCategory.SANITATION,
      location: "Colaba Woods, Near Navy Nagar",
      priority: Priority.LOW,
      status: Status.PENDING,
      departmentName: "Sanitation Department",
      latitude: 18.9067,
      longitude: 72.8147,
    },
    {
      title: "Public toilet not maintained",
      details:
        "The public toilet facility near the market is in terrible condition and hasn't been cleaned in weeks.",
      category: ComplaintCategory.SANITATION,
      location: "Andheri Station Road",
      priority: Priority.MEDIUM,
      status: Status.RESOLVED,
      departmentName: "Sanitation Department",
      latitude: 19.1195,
      longitude: 72.8465,
    },

    // ROADS COMPLAINTS
    {
      title: "Deep pothole causing accidents",
      details:
        "A large pothole has developed on the main road. Two bike accidents have already occurred.",
      category: ComplaintCategory.ROADS,
      location: "Ghodbunder Road, Thane",
      priority: Priority.HIGH,
      status: Status.IN_PROGRESS,
      departmentName: "Roads Department",
      latitude: 19.2183,
      longitude: 72.9781,
    },
    {
      title: "Road construction incomplete",
      details:
        "Road construction work started 2 months ago but has been abandoned midway causing traffic issues.",
      category: ComplaintCategory.ROADS,
      location: "Western Express Highway Service Road",
      priority: Priority.MEDIUM,
      status: Status.PENDING,
      departmentName: "Roads Department",
      latitude: 19.168,
      longitude: 72.848,
    },
    {
      title: "Broken footpath",
      details:
        "The footpath is completely broken with exposed metal rods. Very dangerous for pedestrians.",
      category: ComplaintCategory.ROADS,
      location: "SV Road, Malad West",
      priority: Priority.HIGH,
      status: Status.PENDING,
      departmentName: "Roads Department",
      latitude: 19.1854,
      longitude: 72.8485,
    },
    {
      title: "Need speed breaker",
      details:
        "Vehicles speed excessively on this road near the school. A speed breaker is urgently needed.",
      category: ComplaintCategory.ROADS,
      location: "Near Hiranandani School, Powai",
      priority: Priority.MEDIUM,
      status: Status.RESOLVED,
      departmentName: "Roads Department",
      latitude: 19.1165,
      longitude: 72.9045,
    },
    {
      title: "Road marking faded",
      details:
        "All road markings including zebra crossing and lane dividers have completely faded.",
      category: ComplaintCategory.ROADS,
      location: "Worli Sea Link Exit",
      priority: Priority.LOW,
      status: Status.PENDING,
      departmentName: "Roads Department",
      latitude: 19.0125,
      longitude: 72.8175,
    },

    // OTHER COMPLAINTS
    {
      title: "Park maintenance required",
      details:
        "The park equipment is broken and the garden is not being maintained properly.",
      category: ComplaintCategory.OTHER,
      location: "Borivali National Park Area",
      priority: Priority.LOW,
      status: Status.PENDING,
      departmentName: "Public Works",
      latitude: 19.2355,
      longitude: 72.855,
    },
    {
      title: "Stray dog menace",
      details:
        "Aggressive stray dogs in the area are causing fear, especially for children and elderly.",
      category: ComplaintCategory.OTHER,
      location: "Vikhroli East, Residential Area",
      priority: Priority.MEDIUM,
      status: Status.IN_PROGRESS,
      departmentName: "Public Works",
      latitude: 19.1085,
      longitude: 72.9235,
    },
    {
      title: "Tree trimming needed",
      details:
        "Large tree branches are touching power lines and could cause accidents during storms.",
      category: ComplaintCategory.OTHER,
      location: "Hill Road, Bandra West",
      priority: Priority.MEDIUM,
      status: Status.RESOLVED,
      departmentName: "Public Works",
      latitude: 19.0515,
      longitude: 72.8285,
    },
  ];

  // ============================================
  // CREATE COMPLAINTS WITH NESTED DATA
  // ============================================
  let complaintCount = 0;
  let activityCount = 0;
  let commentCount = 0;
  let notificationCount = 0;

  for (const template of complaintTemplates) {
    const user = randomElement(regularUsers);
    const department = allDepartments.find((d) =>
      d.name.includes(template.departmentName),
    );
    const departmentStaffIds = department ? staffUsers[department.id] : [];

    const createdAt = randomPastDate(30);
    const assignedToId =
      template.status !== Status.PENDING && departmentStaffIds?.length
        ? randomElement(departmentStaffIds)
        : null;

    // Add some variation to coordinates (within 200m radius)
    const coords = generateNearbyCoord(
      template.latitude,
      template.longitude,
      0.2,
    );

    // Create complaint with nested activity log and notification
    const complaint = await prisma.complaint.create({
      data: {
        title: template.title,
        details: template.details,
        category: template.category,
        location: template.location,
        latitude: coords.lat,
        longitude: coords.lng,
        priority: template.priority,
        status: template.status,
        userId: user.id,
        departmentId: department?.id,
        assignedToId,
        createdAt,
        updatedAt: createdAt,
        resolvedAt:
          template.status === Status.RESOLVED
            ? addRandomTime(createdAt, 168)
            : null,

        // Nested create: Activity log for creation
        activities: {
          create: {
            action: ActivityAction.NEW_COMPLAINT,
            newValue: template.status,
            comment: "Complaint submitted",
            userId: user.id,
            createdAt,
          },
        },

        // Nested create: Notification for user
        notifications: {
          create: {
            title: "Complaint Registered",
            message: `Your complaint "${template.title}" has been registered.`,
            type: NotificationType.COMPLAINT_CREATED,
            userId: user.id,
            isRead: Math.random() > 0.5,
            createdAt,
          },
        },
      },
    });

    complaintCount++;
    activityCount++;
    notificationCount++;

    // Add assignment activity and notification if assigned
    if (assignedToId) {
      const assignedAt = addRandomTime(createdAt, 24);

      await prisma.complaintActivity.create({
        data: {
          complaintId: complaint.id,
          userId: admin.id,
          action: ActivityAction.ASSIGNED,
          newValue: assignedToId,
          comment: "Complaint assigned to staff member",
          createdAt: assignedAt,
        },
      });
      activityCount++;

      await prisma.notification.create({
        data: {
          userId: assignedToId,
          complaintId: complaint.id,
          title: "New Assignment",
          message: `You have been assigned complaint: ${template.title}`,
          type: NotificationType.COMPLAINT_ASSIGNED,
          createdAt: assignedAt,
        },
      });
      notificationCount++;
    }

    // Add status change activity for in-progress complaints
    if (template.status === Status.IN_PROGRESS) {
      const statusChangeAt = addRandomTime(createdAt, 48);

      await prisma.complaintActivity.create({
        data: {
          complaintId: complaint.id,
          userId: assignedToId || admin.id,
          action: ActivityAction.STATUS_CHANGED,
          oldValue: Status.PENDING,
          newValue: Status.IN_PROGRESS,
          comment: "Work started on this complaint",
          createdAt: statusChangeAt,
        },
      });
      activityCount++;

      await prisma.notification.create({
        data: {
          userId: user.id,
          complaintId: complaint.id,
          title: "Status Updated",
          message: `Your complaint is now in progress: ${template.title}`,
          type: NotificationType.STATUS_UPDATED,
          createdAt: statusChangeAt,
        },
      });
      notificationCount++;
    }

    // Add comments and resolution for resolved complaints
    if (template.status === Status.RESOLVED && assignedToId) {
      const commentAt = addRandomTime(createdAt, 96);
      const resolveAt = addRandomTime(commentAt, 24);

      await prisma.comment.create({
        data: {
          complaintId: complaint.id,
          authorId: assignedToId,
          content: "We have inspected the site and are working on a solution.",
          isInternal: false,
          createdAt: commentAt,
          updatedAt: commentAt,
        },
      });
      commentCount++;

      await prisma.complaintActivity.create({
        data: {
          complaintId: complaint.id,
          userId: assignedToId,
          action: ActivityAction.COMMENT_ADDED,
          comment: "Staff added a comment",
          createdAt: commentAt,
        },
      });
      activityCount++;

      await prisma.complaintActivity.create({
        data: {
          complaintId: complaint.id,
          userId: assignedToId,
          action: ActivityAction.STATUS_CHANGED,
          oldValue: Status.IN_PROGRESS,
          newValue: Status.RESOLVED,
          comment: "Issue has been resolved",
          createdAt: resolveAt,
        },
      });
      activityCount++;

      await prisma.notification.create({
        data: {
          userId: user.id,
          complaintId: complaint.id,
          title: "Complaint Resolved",
          message: `Your complaint has been resolved: ${template.title}`,
          type: NotificationType.RESOLVED,
          isRead: Math.random() > 0.3,
          createdAt: resolveAt,
        },
      });
      notificationCount++;

      await prisma.comment.create({
        data: {
          complaintId: complaint.id,
          authorId: user.id,
          content: "Thank you for resolving this issue!",
          isInternal: false,
          createdAt: addRandomTime(resolveAt, 12),
          updatedAt: addRandomTime(resolveAt, 12),
        },
      });
      commentCount++;
    }

    // Add internal staff comments for some in-progress complaints
    if (
      template.status === Status.IN_PROGRESS &&
      assignedToId &&
      Math.random() > 0.5
    ) {
      await prisma.comment.create({
        data: {
          complaintId: complaint.id,
          authorId: assignedToId,
          content:
            "Internal note: Requires additional resources from central depot.",
          isInternal: true,
          createdAt: addRandomTime(createdAt, 72),
          updatedAt: addRandomTime(createdAt, 72),
        },
      });
      commentCount++;
    }
  }

  console.log(
    `✅ Created ${complaintCount} detailed complaints with coordinates`,
  );
  console.log(`✅ Created ${activityCount} activity logs`);
  console.log(`✅ Created ${commentCount} comments`);
  console.log(`✅ Created ${notificationCount} notifications`);

  // ============================================
  // FINAL SUMMARY
  // ============================================
  const totalComplaints = await prisma.complaint.count();
  const totalActivities = await prisma.complaintActivity.count();
  const totalComments = await prisma.comment.count();
  const totalNotifications = await prisma.notification.count();
  const totalStaff = Object.values(staffUsers).flat().length;

  console.log("\n" + "=".repeat(50));
  console.log("✅ DATABASE SEEDED SUCCESSFULLY!");
  console.log("=".repeat(50));
  console.log("\n📊 Seed Summary:");
  console.log(`   - ${allDepartments.length} departments`);
  console.log(`   - 1 admin user`);
  console.log(`   - ${totalStaff} staff members`);
  console.log(`   - ${regularUsers.length} regular users`);
  console.log(`   - ${totalComplaints} total complaints (all with GPS coords)`);
  console.log(`   - ${publicLocations.length} public locations`);
  console.log(`   - ${totalActivities} activity logs`);
  console.log(`   - ${totalComments} comments`);
  console.log(`   - ${totalNotifications} notifications`);
  console.log("\n🔐 Login Credentials:");
  console.log("   Admin:  admin@municipality.gov / 12345678");
  console.log("   User:   rajesh.kumar@gmail.com / 12345678");
  console.log("   Staff:  water.officer@municipality.gov / 12345678");
  console.log("\n📍 Map Features:");
  console.log("   - All complaints have realistic Mumbai coordinates");
  console.log("   - 15 public garbage collection locations");
  console.log("   - Complaints spread across Mumbai areas");
  console.log("=".repeat(50) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
