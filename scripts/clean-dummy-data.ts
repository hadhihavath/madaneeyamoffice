import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup: Removing all dummy data...");

  // 1. Delete all operational activity records
  console.log("-> Deleting notifications...");
  await prisma.notification.deleteMany();

  console.log("-> Deleting audit logs...");
  await prisma.auditLog.deleteMany();

  console.log("-> Deleting messages & conversations...");
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();

  console.log("-> Deleting calendar events...");
  await prisma.calendarEvent.deleteMany();

  console.log("-> Deleting documents...");
  await prisma.document.deleteMany();

  console.log("-> Deleting announcements...");
  await prisma.announcement.deleteMany();

  console.log("-> Deleting tasks...");
  await prisma.task.deleteMany();

  console.log("-> Deleting leave requests...");
  await prisma.leaveRequest.deleteMany();

  console.log("-> Deleting attendance records...");
  await prisma.attendance.deleteMany();

  // 2. Delete all employees and users
  console.log("-> Deleting all existing employees...");
  await prisma.employee.deleteMany();

  console.log("-> Deleting all existing users...");
  await prisma.user.deleteMany();

  // 3. Ensure Organization exists
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "CEEM Madaneeyam E-Learning",
        slug: "ceem-madaneeyam",
        logoUrl: "/brand/logo_en.png",
        settings: JSON.stringify({
          defaultWorkHours: 8,
          checkInGraceMinutes: 15,
          timezone: "Asia/Kolkata",
        }),
      },
    });
  }

  // 4. Ensure Offices exist
  const officesConfig = [
    {
      name: "Kozhikode Office (HQ)",
      code: "CLT",
      address: "CEEM Tower, Mavoor Road, Kozhikode",
      city: "Kozhikode",
      state: "Kerala",
      country: "India",
      latitude: 11.2588,
      longitude: 75.7804,
      attendanceRadius: 100,
      phone: "+91 495 272 1001",
      email: "kozhikode@ceem.edu",
    },
    {
      name: "Malappuram Office",
      code: "MLP",
      address: "Madaneeyam Complex, Up Hill, Malappuram",
      city: "Malappuram",
      state: "Kerala",
      country: "India",
      latitude: 11.0732,
      longitude: 76.074,
      attendanceRadius: 100,
      phone: "+91 483 273 4002",
      email: "malappuram@ceem.edu",
    },
    {
      name: "Kannur Office",
      code: "KNR",
      address: "Knowledge City Campus, Thana, Kannur",
      city: "Kannur",
      state: "Kerala",
      country: "India",
      latitude: 11.8745,
      longitude: 75.3704,
      attendanceRadius: 100,
      phone: "+91 497 270 5003",
      email: "kannur@ceem.edu",
    },
    {
      name: "Kochi Regional Office",
      code: "COK",
      address: "Metro Valley Centre, Edappally, Kochi",
      city: "Kochi",
      state: "Kerala",
      country: "India",
      latitude: 10.0261,
      longitude: 76.3125,
      attendanceRadius: 150,
      phone: "+91 484 280 6004",
      email: "kochi@ceem.edu",
    },
    {
      name: "Wayanad Hills Branch",
      code: "WYD",
      address: "Green Valley Hub, Kalpetta, Wayanad",
      city: "Kalpetta",
      state: "Kerala",
      country: "India",
      latitude: 11.6103,
      longitude: 76.0828,
      attendanceRadius: 100,
      phone: "+91 493 620 7005",
      email: "wayanad@ceem.edu",
    },
  ];

  for (const o of officesConfig) {
    const existing = await prisma.office.findUnique({ where: { code: o.code } });
    if (!existing) {
      await prisma.office.create({
        data: {
          ...o,
          organizationId: org.id,
          status: "ACTIVE",
        },
      });
    }
  }

  // 5. Ensure Departments exist
  const deptNames = [
    { name: "Academic Affairs", code: "ACAD" },
    { name: "IT & Systems", code: "IT" },
    { name: "Administration & Governance", code: "ADMIN" },
    { name: "Media & Production", code: "MEDIA" },
    { name: "Student Support & Advisory", code: "SUPPORT" },
  ];

  for (const d of deptNames) {
    const existing = await prisma.department.findUnique({ where: { code: d.code } });
    if (!existing) {
      await prisma.department.create({
        data: {
          ...d,
          organizationId: org.id,
        },
      });
    }
  }

  const hqOffice = await prisma.office.findFirst({ where: { code: "CLT" } });
  const adminDept = await prisma.department.findFirst({ where: { code: "ADMIN" } });

  // 6. Create the ONLY user: hadihavath921@gmail.com
  const adminEmail = "hadihavath921@gmail.com";
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      userId: adminUser.id,
      employeeId: "CEEM-001",
      firstName: "Hadi",
      lastName: "Havath",
      email: adminEmail,
      phone: "+91 9876543210",
      avatarUrl: "/brand/logo_en.png",
      designation: "Super Administrator & Managing Director",
      officeId: hqOffice!.id,
      departmentId: adminDept!.id,
      employmentStatus: "ACTIVE",
      address: "Kozhikode, Kerala, India",
    },
  });

  // Log initial system setup audit record
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      actorName: "Hadi Havath",
      actorEmail: adminEmail,
      action: "DATABASE_INITIALIZED",
      resourceType: "SETTINGS",
      resourceId: adminUser.id,
      details: "Database cleansed of all dummy records. Initialized single Super Admin account hadihavath921@gmail.com.",
      ipAddress: "127.0.0.1",
    },
  });

  console.log("✅ Cleanup Complete!");
  console.log("-----------------------------------------");
  console.log(`Single Admin User: ${adminEmail}`);
  console.log(`Password:          Password123!`);
  console.log(`Role:              SUPER_ADMIN`);
  console.log(`Employee Record:   Hadi Havath (CEEM-001)`);
  console.log("All dummy employees, attendances, leaves, tasks, messages, and docs removed.");
  console.log("-----------------------------------------");
}

cleanDatabase()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
