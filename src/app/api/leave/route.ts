import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status && status !== "ALL") whereClause.status = status;

    // Role Scoping
    if (session.role === "EMPLOYEE") {
      whereClause.employeeId = session.employeeId;
    } else if (session.role === "OFFICE_MANAGER" && session.officeId) {
      whereClause.officeId = session.officeId;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            office: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      pending: leaveRequests.filter((l) => l.status === "PENDING").length,
      approved: leaveRequests.filter((l) => l.status === "APPROVED").length,
      rejected: leaveRequests.filter((l) => l.status === "REJECTED").length,
      total: leaveRequests.length,
    };

    return NextResponse.json({ leaveRequests, stats });
  } catch (error) {
    console.error("Leave list error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !session.employeeId || !session.officeId) {
      return NextResponse.json({ error: "Unauthorized. Employee profile required." }, { status: 401 });
    }

    const { leaveType, startDate, endDate, reason } = await req.json();

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Missing required leave fields" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: session.employeeId,
        officeId: session.officeId,
        leaveType: leaveType || "CASUAL",
        startDate,
        endDate,
        totalDays,
        reason,
        status: "PENDING",
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, leave }, { status: 201 });
  } catch (error) {
    console.error("Leave create error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
