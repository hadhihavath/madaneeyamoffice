import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding clean database for CEEM Madaneeyam Office...");

  // Clear existing records to ensure fresh idempotent seed
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.task.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.office.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: "CEEM Madaneeyam E-Learning",
      slug: "ceem-madaneeyam",
      logoUrl: "/brand/logo_en.png",
      settings: JSON.stringify({
        defaultWorkHours: 8,
        checkInGraceMinutes: 15,
        allowedIpRanges: ["192.168.1.0/24", "10.0.0.0/16"],
        timezone: "Asia/Kolkata",
      }),
    },
  });

  console.log(`Created Organization: ${org.name}`);

  // 2. Office (Calicut Office HQ)
  const officeCalicut = await prisma.office.create({
    data: {
      organizationId: org.id,
      name: "Calicut Office (HQ)",
      code: "CLT",
      address: "Career helps, Calicut, Kerala, India",
      city: "Calicut",
      state: "Kerala",
      country: "India",
      latitude: 11.422415,
      longitude: 75.898374,
      attendanceRadius: 100,
      status: "ACTIVE",
      phone: "+91 495 272 1001",
      email: "calicut@ceem.edu",
    },
  });

  console.log("Created Calicut Office (HQ).");

  // 3. Departments
  const deptAcad = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "Academic Affairs",
      code: "ACAD",
      description: "Curriculum development, teaching standards, and online learning delivery",
    },
  });

  const deptIT = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "IT & Systems",
      code: "IT",
      description: "Software platforms, enterprise architecture, security, and cloud infrastructure",
    },
  });

  const deptAdmin = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "Administration & Governance",
      code: "ADMIN",
      description: "Facility operations, general administration, and governance compliance",
    },
  });

  const deptMedia = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "Media & Production",
      code: "MEDIA",
      description: "Video production, live streaming, studio recording, and publishing",
    },
  });

  const deptSupport = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: "Student Support & Advisory",
      code: "SUPPORT",
      description: "Learner onboarding, counselling, queries, and student engagement",
    },
  });

  console.log("Created 5 Core Departments.");

  // 4. Single Super Admin User: hadihavath921@gmail.com
  const adminEmail = "hadihavath921@gmail.com";
  const passwordHash = await bcrypt.hash("Adminhadi100", 10);

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
      officeId: officeCalicut.id,
      departmentId: deptAdmin.id,
      employmentStatus: "ACTIVE",
      address: "Kozhikode, Kerala, India",
    },
  });

  // Default communication channels for the organization
  const generalChannel = await prisma.conversation.create({
    data: {
      type: "CHANNEL",
      name: "general",
      description: "Company-wide general announcements and discussion",
      officeId: officeCalicut.id,
      members: {
        create: {
          userId: adminUser.id,
        },
      },
    },
  });

  // Welcome Announcement
  await prisma.announcement.create({
    data: {
      title: "Welcome to CEEM Madaneeyam Office Platform",
      content: "Workspace successfully initialized. Use the Super Admin portal to manage branches, geofences, and invite new staff.",
      priority: "IMPORTANT",
      targetAudience: "EVERYONE",
      authorId: adminUser.id,
      officeId: officeCalicut.id,
      isPinned: true,
    },
  });

  // Initial audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      actorName: "Hadi Havath",
      actorEmail: adminEmail,
      action: "DATABASE_INITIALIZED",
      resourceType: "SETTINGS",
      resourceId: adminUser.id,
      details: "Database initialized with clean single Super Admin account.",
      ipAddress: "127.0.0.1",
    },
  });

  console.log("-----------------------------------------");
  console.log(`✅ Clean Seed Complete!`);
  console.log(`Super Admin User: ${adminEmail}`);
  console.log(`Password:         Password123!`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
