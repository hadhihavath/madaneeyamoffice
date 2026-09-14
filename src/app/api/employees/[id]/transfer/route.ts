import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR"])) {
      return NextResponse.json({ error: "Forbidden. HR or Admin required to transfer employees." }, { status: 403 });
    }

    const { targetOfficeId, reason } = await req.json();

    if (!targetOfficeId) {
      return NextResponse.json({ error: "targetOfficeId is required" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { office: true, user: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const targetOffice = await prisma.office.findUnique({
      where: { id: targetOfficeId },
    });

    if (!targetOffice) {
      return NextResponse.json({ error: "Target office not found" }, { status: 404 });
    }

    if (employee.officeId === targetOfficeId) {
      return NextResponse.json({ error: "Employee is already assigned to this office." }, { status: 400 });
    }

    const oldOfficeName = employee.office.name;

    // Execute transfer
    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: { officeId: targetOfficeId },
      include: { office: true, department: true },
    });

    // Create Immutable Audit Log
    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "EMPLOYEE_TRANSFER",
      resourceType: "EMPLOYEE",
      resourceId: employee.id,
      details: `Transferred employee ${employee.firstName} ${employee.lastName} (${employee.employeeId}) from ${oldOfficeName} to ${targetOffice.name}. Reason: ${reason || "Organizational restructuring"}`,
      previousValue: JSON.stringify({ officeId: employee.officeId, officeName: oldOfficeName }),
      newValue: JSON.stringify({ officeId: targetOffice.id, officeName: targetOffice.name }),
    });

    // Notify employee of transfer
    await prisma.notification.create({
      data: {
        userId: employee.userId,
        title: "Office Transfer Notification",
        message: `You have been officially transferred to ${targetOffice.name}. Your attendance geofence has been updated accordingly.`,
        type: "SYSTEM",
        linkUrl: "/attendance",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Employee transferred to ${targetOffice.name} successfully.`,
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
