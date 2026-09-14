import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding for CEEM Madaneeyam Office...");

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

  const passwordHash = await bcrypt.hash("Password123!", 10);

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

  // 2. Offices
  const officeKozhikode = await prisma.office.create({
    data: {
      organizationId: org.id,
      name: "Kozhikode Office (HQ)",
      code: "CLT",
      address: "CEEM Tower, Mavoor Road, Kozhikode",
      city: "Kozhikode",
      state: "Kerala",
      country: "India",
      latitude: 11.2588,
      longitude: 75.7804,
      attendanceRadius: 100, // 100m
      status: "ACTIVE",
      phone: "+91 495 272 1001",
      email: "kozhikode@ceem.edu",
    },
  });

  const officeMalappuram = await prisma.office.create({
    data: {
      organizationId: org.id,
      name: "Malappuram Office",
      code: "MLP",
      address: "Madaneeyam Complex, Up Hill, Malappuram",
      city: "Malappuram",
      state: "Kerala",
      country: "India",
      latitude: 11.0732,
      longitude: 76.0740,
      attendanceRadius: 150, // 150m
      status: "ACTIVE",
      phone: "+91 483 273 4002",
      email: "malappuram@ceem.edu",
    },
  });

  const officeKannur = await prisma.office.create({
    data: {
      organizationId: org.id,
      name: "Kannur Office",
      code: "KNR",
      address: "Green Plaza, Fort Road, Kannur",
      city: "Kannur",
      state: "Kerala",
      country: "India",
      latitude: 11.8745,
      longitude: 75.3704,
      attendanceRadius: 100,
      status: "ACTIVE",
      phone: "+91 497 270 8003",
      email: "kannur@ceem.edu",
    },
  });

  const officeKochi = await prisma.office.create({
    data: {
      organizationId: org.id,
      name: "Kochi Office",
      code: "COK",
      address: "Infopark Phase 2, Kakkanad, Kochi",
      city: "Kochi",
      state: "Kerala",
      country: "India",
      latitude: 9.9312,
      longitude: 76.2673,
      attendanceRadius: 120,
      status: "ACTIVE",
      phone: "+91 484 290 6004",
      email: "kochi@ceem.edu",
    },
  });

  const officeWayanad = await prisma.office.create({
    data: {
      organizationId: org.id,
      name: "Wayanad Office",
      code: "WYD",
      address: "Highland Academic Center, Kalpetta, Wayanad",
      city: "Wayanad",
      state: "Kerala",
      country: "India",
      latitude: 11.6050,
      longitude: 76.0830,
      attendanceRadius: 100,
      status: "ACTIVE",
      phone: "+91 493 250 9005",
      email: "wayanad@ceem.edu",
    },
  });

  console.log("Created 5 Offices: Kozhikode, Malappuram, Kannur, Kochi, Wayanad");

  // 3. Departments
  const deptAdmin = await prisma.department.create({
    data: { organizationId: org.id, name: "Administration", code: "ADM", description: "Executive leadership and office oversight" },
  });
  const deptHR = await prisma.department.create({
    data: { organizationId: org.id, name: "HR", code: "HR", description: "Human resources, recruitment, and culture" },
  });
  const deptDev = await prisma.department.create({
    data: { organizationId: org.id, name: "Software Development", code: "DEV", description: "Core platform engineering and cloud systems" },
  });
  const deptWeb = await prisma.department.create({
    data: { organizationId: org.id, name: "Web Development", code: "WEB", description: "Web applications and frontend portals" },
  });
  const deptELearn = await prisma.department.create({
    data: { organizationId: org.id, name: "E-Learning Content", code: "ELRN", description: "Course material, media, and interactive curriculum" },
  });
  const deptMkt = await prisma.department.create({
    data: { organizationId: org.id, name: "Marketing", code: "MKT", description: "Digital outreach, student enrollment, and branding" },
  });
  const deptAccounts = await prisma.department.create({
    data: { organizationId: org.id, name: "Accounts & Finance", code: "ACC", description: "Financial audits, payroll, and billing" },
  });
  const deptAcademic = await prisma.department.create({
    data: { organizationId: org.id, name: "Academic Affairs", code: "ACAD", description: "Instructor guidance and academic standards" },
  });
  const deptSupport = await prisma.department.create({
    data: { organizationId: org.id, name: "Student Support", code: "SUP", description: "Learner assistance and customer success" },
  });
  const deptOps = await prisma.department.create({
    data: { organizationId: org.id, name: "Operations", code: "OPS", description: "Logistics, facilities, and campus operations" },
  });

  console.log("Created 10 Departments");

  // Helper to create User + Employee
  async function createStaff({
    email,
    role,
    firstName,
    lastName,
    employeeId,
    phone,
    designation,
    officeId,
    departmentId,
    address,
  }: {
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    phone: string;
    designation: string;
    officeId: string;
    departmentId: string;
    address: string;
  }) {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        status: "ACTIVE",
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        designation,
        officeId,
        departmentId,
        address,
        employmentStatus: "ACTIVE",
        avatarUrl: `https://images.unsplash.com/photo-${
          role === "SUPER_ADMIN"
            ? "1534528741775-53994a69daeb"
            : role === "HR"
            ? "1573496359142-b8d87734a5a2"
            : role === "OFFICE_MANAGER"
            ? "1507003211169-0a1dd7228f2d"
            : "1500648767791-00dcc994a43e"
        }?w=150&auto=format&fit=crop&q=80`,
      },
    });

    return { user, employee };
  }

  // 4. Create Key Staff across roles
  const superAdmin = await createStaff({
    email: "admin@ceem.edu",
    role: "SUPER_ADMIN",
    firstName: "Havath",
    lastName: "Rahman",
    employeeId: "CEEM-001",
    phone: "+91 98470 11223",
    designation: "Executive Director & System Architect",
    officeId: officeKozhikode.id,
    departmentId: deptAdmin.id,
    address: "West Hill, Kozhikode",
  });

  const hrManager = await createStaff({
    email: "hr@ceem.edu",
    role: "HR",
    firstName: "Fatima",
    lastName: "Zahra",
    employeeId: "CEEM-002",
    phone: "+91 98470 33445",
    designation: "Head of People & Culture",
    officeId: officeKozhikode.id,
    departmentId: deptHR.id,
    address: "Palayam, Kozhikode",
  });

  const cltManager = await createStaff({
    email: "kozhikode.manager@ceem.edu",
    role: "OFFICE_MANAGER",
    firstName: "Tariq",
    lastName: "Al-Mansoor",
    employeeId: "CEEM-003",
    phone: "+91 98470 55667",
    designation: "Kozhikode Regional Office Manager",
    officeId: officeKozhikode.id,
    departmentId: deptOps.id,
    address: "Eranhipalam, Kozhikode",
  });

  // Assign office managers in Office table
  await prisma.office.update({ where: { id: officeKozhikode.id }, data: { managerId: cltManager.employee.id } });

  const mlpManager = await createStaff({
    email: "malappuram.manager@ceem.edu",
    role: "OFFICE_MANAGER",
    firstName: "Bilal",
    lastName: "Ibrahim",
    employeeId: "CEEM-004",
    phone: "+91 98470 77889",
    designation: "Malappuram Regional Office Manager",
    officeId: officeMalappuram.id,
    departmentId: deptOps.id,
    address: "Manjeri Road, Malappuram",
  });
  await prisma.office.update({ where: { id: officeMalappuram.id }, data: { managerId: mlpManager.employee.id } });

  // Main demo employee
  const employeeAhmed = await createStaff({
    email: "ahmed.employee@ceem.edu",
    role: "EMPLOYEE",
    firstName: "Ahmed",
    lastName: "Farooqui",
    employeeId: "CEEM-005",
    phone: "+91 98470 99001",
    designation: "Senior E-Learning Platform Engineer",
    officeId: officeKozhikode.id,
    departmentId: deptDev.id,
    address: "Nadakkavu, Kozhikode",
  });

  const empAisha = await createStaff({
    email: "aisha.dev@ceem.edu",
    role: "EMPLOYEE",
    firstName: "Aisha",
    lastName: "Siddiqa",
    employeeId: "CEEM-006",
    phone: "+91 98471 11223",
    designation: "Full Stack Web Developer",
    officeId: officeKozhikode.id,
    departmentId: deptWeb.id,
    address: "Bilathikulam, Kozhikode",
  });

  const empOmar = await createStaff({
    email: "omar.content@ceem.edu",
    role: "EMPLOYEE",
    firstName: "Omar",
    lastName: "Khalid",
    employeeId: "CEEM-007",
    phone: "+91 98471 22334",
    designation: "Curriculum Content Specialist",
    officeId: officeMalappuram.id,
    departmentId: deptELearn.id,
    address: "Down Hill, Malappuram",
  });

  const empMaryam = await createStaff({
    email: "maryam.support@ceem.edu",
    role: "EMPLOYEE",
    firstName: "Maryam",
    lastName: "Nisar",
    employeeId: "CEEM-008",
    phone: "+91 98471 33445",
    designation: "Student Support Specialist",
    officeId: officeKannur.id,
    departmentId: deptSupport.id,
    address: "Thalassery, Kannur",
  });

  const empZain = await createStaff({
    email: "zain.academic@ceem.edu",
    role: "EMPLOYEE",
    firstName: "Zainul",
    lastName: "Abideen",
    employeeId: "CEEM-009",
    phone: "+91 98471 44556",
    designation: "Academic Programs Advisor",
    officeId: officeKochi.id,
    departmentId: deptAcademic.id,
    address: "Aluva, Kochi",
  });

  const empShifa = await createStaff({
    email: "shifa.accounts@ceem.edu",
    role: "EMPLOYEE",
    firstName: "Shifa",
    lastName: "Parveen",
    employeeId: "CEEM-010",
    phone: "+91 98471 55667",
    designation: "Senior Accounts Officer",
    officeId: officeKozhikode.id,
    departmentId: deptAccounts.id,
    address: "Kallai, Kozhikode",
  });

  const empHassan = await createStaff({
    email: "hassan.media@ceem.edu",
    role: "EMPLOYEE",
    firstName: "Hassan",
    lastName: "Basheer",
    employeeId: "CEEM-011",
    phone: "+91 98471 66778",
    designation: "Digital Media Specialist",
    officeId: officeWayanad.id,
    departmentId: deptMkt.id,
    address: "Sulthan Bathery, Wayanad",
  });

  console.log("Created Staff across multiple offices");

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  // 5. Seed Attendance Records for Today
  // Ahmed is checked in at Kozhikode office 42m away
  const checkInAhmed = new Date();
  checkInAhmed.setHours(9, 2, 0, 0);

  await prisma.attendance.create({
    data: {
      employeeId: employeeAhmed.employee.id,
      officeId: officeKozhikode.id,
      date: todayStr,
      checkInTime: checkInAhmed,
      checkInLat: 11.2591,
      checkInLon: 75.7806,
      distanceMeters: 42.5,
      locationAccuracy: 8.2,
      status: "PRESENT",
      isSuspicious: false,
      workDurationMinutes: 185,
      deviceInfo: "Chrome on macOS / Windows Desktop",
      ipAddress: "192.168.1.45",
      notes: "Routine biometric GPS check-in",
    },
  });

  // Aisha checked in on time
  const checkInAisha = new Date();
  checkInAisha.setHours(8, 55, 0, 0);
  await prisma.attendance.create({
    data: {
      employeeId: empAisha.employee.id,
      officeId: officeKozhikode.id,
      date: todayStr,
      checkInTime: checkInAisha,
      checkInLat: 11.2589,
      checkInLon: 75.7803,
      distanceMeters: 18.2,
      locationAccuracy: 5.4,
      status: "PRESENT",
      workDurationMinutes: 192,
      deviceInfo: "Safari on iPhone 15 Pro",
      ipAddress: "192.168.1.52",
    },
  });

  // Tariq (Kozhikode Manager) checked in
  const checkInTariq = new Date();
  checkInTariq.setHours(8, 48, 0, 0);
  await prisma.attendance.create({
    data: {
      employeeId: cltManager.employee.id,
      officeId: officeKozhikode.id,
      date: todayStr,
      checkInTime: checkInTariq,
      checkInLat: 11.2588,
      checkInLon: 75.7804,
      distanceMeters: 12.0,
      locationAccuracy: 6.0,
      status: "PRESENT",
      workDurationMinutes: 200,
      deviceInfo: "Edge on Windows 11",
      ipAddress: "192.168.1.10",
    },
  });

  // Omar at Malappuram checked in
  const checkInOmar = new Date();
  checkInOmar.setHours(9, 15, 0, 0);
  await prisma.attendance.create({
    data: {
      employeeId: empOmar.employee.id,
      officeId: officeMalappuram.id,
      date: todayStr,
      checkInTime: checkInOmar,
      checkInLat: 11.0734,
      checkInLon: 76.0742,
      distanceMeters: 35.8,
      locationAccuracy: 9.1,
      status: "LATE",
      workDurationMinutes: 170,
      deviceInfo: "Chrome on Android Mobile",
      ipAddress: "10.10.2.14",
    },
  });

  // Maryam at Kannur
  const checkInMaryam = new Date();
  checkInMaryam.setHours(8, 59, 0, 0);
  await prisma.attendance.create({
    data: {
      employeeId: empMaryam.employee.id,
      officeId: officeKannur.id,
      date: todayStr,
      checkInTime: checkInMaryam,
      checkInLat: 11.8744,
      checkInLon: 75.3703,
      distanceMeters: 22.1,
      locationAccuracy: 7.0,
      status: "PRESENT",
      workDurationMinutes: 188,
      deviceInfo: "Chrome on macOS",
      ipAddress: "192.168.3.20",
    },
  });

  // Shifa on approved leave today
  await prisma.attendance.create({
    data: {
      employeeId: empShifa.employee.id,
      officeId: officeKozhikode.id,
      date: todayStr,
      status: "LEAVE",
      notes: "Annual Leave Approved",
    },
  });

  console.log("Created Seed Attendance records for today");

  // 6. Seed Leave Requests
  await prisma.leaveRequest.create({
    data: {
      employeeId: empShifa.employee.id,
      officeId: officeKozhikode.id,
      leaveType: "ANNUAL",
      startDate: todayStr,
      endDate: todayStr,
      totalDays: 1,
      reason: "Family medical appointment",
      status: "APPROVED",
      approvedById: hrManager.user.id,
      decisionNote: "Approved as per annual leave quota.",
      decisionDate: new Date(),
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: empZain.employee.id,
      officeId: officeKochi.id,
      leaveType: "CASUAL",
      startDate: "2026-09-20",
      endDate: "2026-09-22",
      totalDays: 3,
      reason: "Attending academic symposium at Cochin University",
      status: "PENDING",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: empOmar.employee.id,
      officeId: officeMalappuram.id,
      leaveType: "SICK",
      startDate: "2026-09-10",
      endDate: "2026-09-11",
      totalDays: 2,
      reason: "Viral fever - doctor prescription provided",
      status: "APPROVED",
      approvedById: mlpManager.user.id,
      decisionNote: "Approved with medical certificate",
      decisionDate: new Date("2026-09-10"),
    },
  });

  console.log("Created Leave Requests");

  // 7. Seed Tasks
  await prisma.task.create({
    data: {
      title: "Deploy Multi-Office Geofencing Microservice",
      description: "Ensure Haversine calculations and 100m/150m radiuses are strictly validated on server-side APIs.",
      priority: "URGENT",
      status: "IN_PROGRESS",
      assignedToId: employeeAhmed.employee.id,
      createdById: superAdmin.user.id,
      officeId: officeKozhikode.id,
      departmentId: deptDev.id,
      dueDate: "2026-09-18",
    },
  });

  await prisma.task.create({
    data: {
      title: "Prepare Q3 E-Learning Video Curriculum",
      description: "Finalize Arabic and English language instructional modules for the web portal.",
      priority: "HIGH",
      status: "TODO",
      assignedToId: empOmar.employee.id,
      createdById: superAdmin.user.id,
      officeId: officeMalappuram.id,
      departmentId: deptELearn.id,
      dueDate: "2026-09-25",
    },
  });

  await prisma.task.create({
    data: {
      title: "Employee Document Auditing for Kannur Office",
      description: "Audit joining letters, ID documents, and emergency contact details for all staff.",
      priority: "MEDIUM",
      status: "REVIEW",
      assignedToId: empMaryam.employee.id,
      createdById: hrManager.user.id,
      officeId: officeKannur.id,
      departmentId: deptHR.id,
      dueDate: "2026-09-22",
    },
  });

  await prisma.task.create({
    data: {
      title: "Setup Office Wi-Fi Geofence & IP Whitelisting",
      description: "Verify Kozhikode and Malappuram static IP assignments for location secondary checks.",
      priority: "LOW",
      status: "COMPLETED",
      assignedToId: empAisha.employee.id,
      createdById: cltManager.user.id,
      officeId: officeKozhikode.id,
      departmentId: deptDev.id,
      dueDate: "2026-09-12",
    },
  });

  console.log("Created Tasks");

  // 8. Seed Announcements
  await prisma.announcement.create({
    data: {
      title: "Welcome to the New CEEM Madaneeyam Office Platform!",
      content: "We are excited to roll out the official CEEM Madaneeyam unified office management and communication platform across all branches (Kozhikode, Malappuram, Kannur, Kochi, and Wayanad). Please ensure your mobile location permission is enabled for seamless GPS attendance.",
      priority: "URGENT",
      targetAudience: "EVERYONE",
      authorId: superAdmin.user.id,
      isPinned: true,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Kozhikode Office Training Session: E-Learning 2.0 Rollout",
      content: "All Kozhikode engineering and content staff are requested to assemble in Conference Room A on Thursday at 3:00 PM for the platform demonstration.",
      priority: "IMPORTANT",
      targetAudience: "SPECIFIC_OFFICE",
      officeId: officeKozhikode.id,
      authorId: cltManager.user.id,
      isPinned: false,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Updated Leave Policy & Public Holidays Guidelines",
      content: "HR has updated the annual leave allocation and official state holiday calendar for the upcoming academic quarter. Please check the Documents section.",
      priority: "NORMAL",
      targetAudience: "EVERYONE",
      authorId: hrManager.user.id,
      isPinned: false,
    },
  });

  console.log("Created Announcements");

  // 9. Seed Conversations & Messages
  // Channel #general
  const convGeneral = await prisma.conversation.create({
    data: {
      type: "CHANNEL",
      name: "#general",
      description: "Company-wide announcements and general discussion",
    },
  });

  const convKozhikode = await prisma.conversation.create({
    data: {
      type: "CHANNEL",
      name: "#kozhikode-office",
      description: "Kozhikode Regional Headquarters team channel",
      officeId: officeKozhikode.id,
      isOfficeChannel: true,
    },
  });

  const convMalappuram = await prisma.conversation.create({
    data: {
      type: "CHANNEL",
      name: "#malappuram-office",
      description: "Malappuram Office branch channel",
      officeId: officeMalappuram.id,
      isOfficeChannel: true,
    },
  });

  const convDev = await prisma.conversation.create({
    data: {
      type: "CHANNEL",
      name: "#software-dev",
      description: "Engineering team updates, code reviews, and architecture",
      departmentId: deptDev.id,
      isDepartmentChannel: true,
    },
  });

  // Direct message between SuperAdmin and Ahmed
  const convDM = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      name: "Ahmed & Havath",
      description: "Direct message",
    },
  });

  // Add members
  const allUsers = [superAdmin.user, hrManager.user, cltManager.user, mlpManager.user, employeeAhmed.user, empAisha.user, empOmar.user, empMaryam.user];
  for (const u of allUsers) {
    await prisma.conversationMember.create({
      data: { conversationId: convGeneral.id, userId: u.id },
    });
  }

  // Kozhikode channel members
  for (const u of [superAdmin.user, hrManager.user, cltManager.user, employeeAhmed.user, empAisha.user, empShifa.user]) {
    await prisma.conversationMember.create({
      data: { conversationId: convKozhikode.id, userId: u.id },
    });
  }

  // Direct message members
  await prisma.conversationMember.create({ data: { conversationId: convDM.id, userId: superAdmin.user.id } });
  await prisma.conversationMember.create({ data: { conversationId: convDM.id, userId: employeeAhmed.user.id } });

  // Messages in #general
  await prisma.message.create({
    data: {
      conversationId: convGeneral.id,
      senderId: superAdmin.user.id,
      content: "Assalamu Alaikum and good morning team! The new CEEM Madaneeyam Office application is officially live.",
      reactions: JSON.stringify([{ emoji: "👋", count: 4 }, { emoji: "🎉", count: 6 }]),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convGeneral.id,
      senderId: employeeAhmed.user.id,
      content: "Checked in using the GPS Geofence module this morning. Smooth 42m detection!",
      reactions: JSON.stringify([{ emoji: "🚀", count: 3 }]),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convGeneral.id,
      senderId: hrManager.user.id,
      content: "Remember to submit any leave requests for the upcoming Eid holidays by this Wednesday.",
      reactions: JSON.stringify([{ emoji: "👍", count: 5 }]),
    },
  });

  // Message in #kozhikode-office
  await prisma.message.create({
    data: {
      conversationId: convKozhikode.id,
      senderId: cltManager.user.id,
      content: "Good morning Kozhikode team. High-speed fiber backup link has been installed in the server room.",
    },
  });

  // Message in DM
  await prisma.message.create({
    data: {
      conversationId: convDM.id,
      senderId: superAdmin.user.id,
      content: "Ahmed, please verify that the attendance radius for Malappuram office is set to 150m as requested.",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convDM.id,
      senderId: employeeAhmed.user.id,
      content: "Verified! Malappuram is set to 150m, Kozhikode and Kannur are set to 100m, and Kochi is 120m.",
    },
  });

  console.log("Created Conversations and Messages");

  // 10. Seed Calendar Events
  await prisma.calendarEvent.create({
    data: {
      title: "All-Hands Quarterly Academic Review",
      description: "Review of student enrollment, e-learning course completions, and multi-office KPIs.",
      eventType: "MEETING",
      startDate: "2026-09-24",
      startTime: "10:00",
      endTime: "11:30",
      location: "Main Auditorium & Online Stream",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      title: "Regional Coordinators Training Workshop",
      description: "Hands-on training on digital attendance records and leave management.",
      eventType: "TRAINING",
      startDate: "2026-09-28",
      startTime: "14:00",
      endTime: "16:00",
      officeId: officeKozhikode.id,
      location: "Training Lab 2",
    },
  });

  await prisma.calendarEvent.create({
    data: {
      title: "Kerala State Holiday: Eid Milad-un-Nabi",
      description: "Official public holiday across all CEEM Madaneeyam offices.",
      eventType: "HOLIDAY",
      startDate: "2026-09-16",
    },
  });

  console.log("Created Calendar Events");

  // 11. Seed Documents
  await prisma.document.create({
    data: {
      title: "CEEM Madaneeyam Employee Code of Conduct & HR Policy 2026",
      category: "HR_POLICIES",
      fileName: "CEEM_HR_Policy_2026.pdf",
      fileUrl: "/brand/Madaneeyam_Logo.pdf",
      fileSize: "2.4 MB",
      accessRole: "ALL",
      uploadedById: hrManager.user.id,
    },
  });

  await prisma.document.create({
    data: {
      title: "Location-Based Attendance Protocol & Geofence FAQ",
      category: "OFFICE_DOCUMENTS",
      fileName: "Attendance_Geofence_Guidelines.pdf",
      fileUrl: "/brand/Madaneeyam_Logo.pdf",
      fileSize: "1.1 MB",
      accessRole: "ALL",
      uploadedById: superAdmin.user.id,
    },
  });

  await prisma.document.create({
    data: {
      title: "Office Manager SOP & Leave Approval Matrix",
      category: "TRAINY_MATERIALS",
      fileName: "Manager_Approval_SOP.pdf",
      fileUrl: "/brand/Madaneeyam_Logo.pdf",
      fileSize: "3.2 MB",
      accessRole: "MANAGERS",
      uploadedById: hrManager.user.id,
    },
  });

  await prisma.document.create({
    data: {
      title: "Travel & Multi-Office Reimbursement Claim Form",
      category: "COMPANY_FORMS",
      fileName: "Travel_Expense_Form.xlsx",
      fileUrl: "/brand/Madaneeyam_Logo.pdf",
      fileSize: "450 KB",
      accessRole: "ALL",
      uploadedById: empShifa.user.id,
    },
  });

  console.log("Created Documents");

  // 12. Seed Notifications
  await prisma.notification.create({
    data: {
      userId: employeeAhmed.user.id,
      title: "Attendance Verified",
      message: "Your check-in at Kozhikode Office was recorded successfully at 09:02 AM (42m within allowed 100m).",
      type: "ATTENDANCE",
      linkUrl: "/attendance",
    },
  });

  await prisma.notification.create({
    data: {
      userId: employeeAhmed.user.id,
      title: "New Task Assigned",
      message: "Super Admin assigned you task: Deploy Multi-Office Geofencing Microservice.",
      type: "TASK",
      linkUrl: "/tasks",
    },
  });

  await prisma.notification.create({
    data: {
      userId: hrManager.user.id,
      title: "New Leave Application",
      message: "Zainul Abideen (Kochi Office) submitted a 3-day Casual Leave request for review.",
      type: "LEAVE",
      linkUrl: "/leave",
    },
  });

  await prisma.notification.create({
    data: {
      userId: superAdmin.user.id,
      title: "Office Geofence Configured",
      message: "Malappuram Office attendance radius adjusted to 150 meters.",
      type: "SYSTEM",
      linkUrl: "/settings",
    },
  });

  console.log("Created Notifications");

  // 13. Seed Audit Logs
  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.user.id,
      actorName: "Dr. Havath Rahman",
      actorEmail: "admin@ceem.edu",
      action: "OFFICE_CREATED",
      resourceType: "OFFICE",
      resourceId: officeWayanad.id,
      details: "Created new branch office: Wayanad Office with 100m GPS radius",
      previousValue: null,
      newValue: JSON.stringify({ name: "Wayanad Office", radius: 100, lat: 11.605, lon: 76.083 }),
      ipAddress: "192.168.1.1",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: hrManager.user.id,
      actorName: "Fatima Zahra",
      actorEmail: "hr@ceem.edu",
      action: "LEAVE_APPROVED",
      resourceType: "LEAVE",
      details: "Approved 1-day Annual Leave for Shifa Parveen (CEEM-010)",
      previousValue: "PENDING",
      newValue: "APPROVED",
      ipAddress: "192.168.1.15",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.user.id,
      actorName: "Dr. Havath Rahman",
      actorEmail: "admin@ceem.edu",
      action: "RADIUS_CONFIGURED",
      resourceType: "SETTINGS",
      details: "Updated Malappuram attendance radius from 100m to 150m for campus layout expansion",
      previousValue: "100",
      newValue: "150",
      ipAddress: "192.168.1.1",
    },
  });

  console.log("Created Audit Logs");
  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
