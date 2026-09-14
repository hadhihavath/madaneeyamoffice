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

    if (session.role === "OFFICE_MANAGER" && session.officeId !== leave.officeId) {
      return NextResponse.json({ error: "Cannot reject leave for employees outside your office" }, { status: 403 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        approvedById: session.userId,
        decisionNote: decisionNote || "Request rejected by management.",
        decisionDate: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: leave.employee.userId,
        title: "Leave Request Rejected",
        message: `Your leave request for ${leave.startDate} has been rejected. Reason: ${decisionNote || "Please consult management"}`,
        type: "LEAVE",
        linkUrl: "/leave",
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "LEAVE_REJECTED",
      resourceType: "LEAVE",
      resourceId: leave.id,
      details: `Rejected ${leave.leaveType} leave for ${leave.employee.firstName} ${leave.employee.lastName}. Reason: ${decisionNote || "None provided"}`,
      previousValue: "PENDING",
      newValue: "REJECTED",
    });

    return NextResponse.json({ success: true, leave: updated });
  } catch (error) {
    console.error("Reject leave error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
