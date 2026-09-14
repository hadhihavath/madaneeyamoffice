import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, role: true, status: true, email: true } },
        office: true,
        department: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 30,
          include: { office: { select: { name: true, code: true } } },
        },
        leaveRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        assignedTasks: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Role-based scoping: Office Managers can only view employees in their office unless Super Admin/HR/Self
    if (
      session.role === "OFFICE_MANAGER" &&
      session.officeId !== employee.officeId &&
      session.employeeId !== employee.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Employee detail error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSelf = session.employeeId === params.id;
    const canManage = hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR"]);

    if (!isSelf && !canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const previous = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!previous) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.phone !== undefined) dataToUpdate.phone = body.phone;
    if (body.emergencyContact !== undefined) dataToUpdate.emergencyContact = body.emergencyContact;
    if (body.address !== undefined) dataToUpdate.address = body.address;

    // Admin/HR only editable fields
    if (canManage) {
      if (body.designation !== undefined) dataToUpdate.designation = body.designation;
      if (body.departmentId !== undefined) dataToUpdate.departmentId = body.departmentId;
      if (body.employmentStatus !== undefined) dataToUpdate.employmentStatus = body.employmentStatus;

      // Update role if requested
      if (body.role && body.role !== previous.user.role) {
        await prisma.user.update({
          where: { id: previous.userId },
          data: { role: body.role },
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        office: true,
        department: true,
        user: { select: { id: true, role: true, status: true } },
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "EMPLOYEE_UPDATED",
      resourceType: "EMPLOYEE",
      resourceId: params.id,
      details: `Updated employee profile for ${previous.firstName} ${previous.lastName}`,
      previousValue: JSON.stringify(previous),
      newValue: JSON.stringify(updated),
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    console.error("Employee update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
