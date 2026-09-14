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
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { decisionNote } = await req.json().catch(() => ({ decisionNote: "" }));

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: { employee: true },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Office Manager isolation
    if (session.role === "OFFICE_MANAGER" && session.officeId !== leave.officeId) {
      return NextResponse.json({ error: "Cannot approve leave for employees outside your office" }, { status: 403 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedById: session.userId,
        decisionNote: decisionNote || "Approved",
        decisionDate: new Date(),
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: leave.employee.userId,
        title: "Leave Request Approved",
        message: `Your ${leave.leaveType} leave request from ${leave.startDate} to ${leave.endDate} has been approved.`,
        type: "LEAVE",
        linkUrl: "/leave",
      },
    });

    // Audit log
    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "LEAVE_APPROVED",
      resourceType: "LEAVE",
      resourceId: leave.id,
      details: `Approved ${leave.leaveType} leave for ${leave.employee.firstName} ${leave.employee.lastName} (${leave.startDate} to ${leave.endDate})`,
      previousValue: "PENDING",
      newValue: "APPROVED",
    });

    return NextResponse.json({ success: true, leave: updated });
  } catch (error) {
    console.error("Approve leave error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
