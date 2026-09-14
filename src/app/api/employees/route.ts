import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let officeId = searchParams.get("officeId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    // Office Manager isolation
    if (session.role === "OFFICE_MANAGER" && session.officeId) {
      officeId = session.officeId;
    }

    const whereClause: any = {};

    if (officeId && officeId !== "ALL") whereClause.officeId = officeId;
    if (departmentId && departmentId !== "ALL") whereClause.departmentId = departmentId;
    if (status && status !== "ALL") whereClause.employmentStatus = status;

    if (role && role !== "ALL") {
      whereClause.user = { role };
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
        { designation: { contains: search } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, role: true, status: true } },
        office: { select: { id: true, name: true, code: true, city: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Employees fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR"])) {
      return NextResponse.json({ error: "Forbidden. HR or Admin only." }, { status: 403 });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      designation,
      officeId,
      departmentId,
      role,
      employeeId,
      emergencyContact,
      address,
      password,
    } = await req.json();

    if (!firstName || !lastName || !email || !officeId || !departmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Auto-generate employeeId if not supplied
    let empCode = employeeId;
    if (!empCode) {
      const count = await prisma.employee.count();
      empCode = `CEEM-${String(count + 1).padStart(3, "0")}`;
    }

    const passwordHash = await bcrypt.hash(password || "Password123!", 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || "EMPLOYEE",
        status: "ACTIVE",
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId: empCode,
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone: phone || "+91 98470 00000",
        designation: designation || "Staff Member",
        officeId,
        departmentId,
        emergencyContact,
        address,
        employmentStatus: "ACTIVE",
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      },
      include: {
        office: true,
        department: true,
        user: true,
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "EMPLOYEE_CREATED",
      resourceType: "EMPLOYEE",
      resourceId: employee.id,
      details: `Created new employee: ${firstName} ${lastName} (${empCode}) assigned to ${employee.office.name}`,
      newValue: JSON.stringify(employee),
    });

    return NextResponse.json({ success: true, employee }, { status: 201 });
  } catch (error) {
    console.error("Employee creation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
