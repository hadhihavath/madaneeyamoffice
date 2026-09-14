import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const offices = await prisma.office.findMany({
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatarUrl: true,
            employmentStatus: true,
          },
        },
        attendances: {
          where: { date: todayStr },
          select: {
            id: true,
            status: true,
            checkInTime: true,
            employeeId: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const enrichedOffices = offices.map((office) => {
      const activeEmployees = office.employees.filter((e) => e.employmentStatus === "ACTIVE");
      const totalEmployees = activeEmployees.length;
      const presentCount = office.attendances.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

      return {
        id: office.id,
        name: office.name,
        code: office.code,
        address: office.address,
        city: office.city,
        state: office.state,
        country: office.country,
        latitude: office.latitude,
        longitude: office.longitude,
        attendanceRadius: office.attendanceRadius,
        status: office.status,
        phone: office.phone,
        email: office.email,
        totalEmployees,
        presentCount,
        attendanceRate,
        managerId: office.managerId,
      };
    });

    return NextResponse.json({ offices: enrichedOffices });
  } catch (error) {
    console.error("Offices fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    const {
      name,
      code,
      address,
      city,
      state,
      latitude,
      longitude,
      attendanceRadius,
      phone,
      email,
    } = await req.json();

    if (!name || !code || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing required office parameters" }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 500 });
    }

    const office = await prisma.office.create({
      data: {
        organizationId: org.id,
        name,
        code: code.toUpperCase().trim(),
        address: address || "",
        city: city || "",
        state: state || "Kerala",
        latitude: Number(latitude),
        longitude: Number(longitude),
        attendanceRadius: Number(attendanceRadius) || 100,
        phone,
        email,
        status: "ACTIVE",
      },
    });

    // Create general office channel
    await prisma.conversation.create({
      data: {
        type: "CHANNEL",
        name: `#${code.toLowerCase()}-office`,
        description: `${name} branch channel`,
        officeId: office.id,
        isOfficeChannel: true,
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "OFFICE_CREATED",
      resourceType: "OFFICE",
      resourceId: office.id,
      details: `Created new office branch: ${name} (${code}) with GPS radius ${office.attendanceRadius}m`,
      newValue: JSON.stringify(office),
    });

    return NextResponse.json({ success: true, office }, { status: 201 });
  } catch (error) {
    console.error("Office creation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
