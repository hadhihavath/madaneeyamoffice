import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only HR, Super Admin, Admin, Office Manager can access attendance panel
    if (!hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    let officeId = searchParams.get("officeId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    // Office Manager isolation: Can only view their own office!
    if (session.role === "OFFICE_MANAGER" && session.officeId) {
      officeId = session.officeId;
    }

    const whereClause: any = {
      date,
    };

    if (officeId) {
      whereClause.officeId = officeId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (departmentId && departmentId !== "ALL") {
      whereClause.employee = {
        departmentId,
      };
    }

    if (search) {
      whereClause.employee = {
        ...(whereClause.employee || {}),
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { employeeId: { contains: search } },
        ],
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            department: { select: { name: true, code: true } },
            office: { select: { name: true, code: true } },
          },
        },
        office: { select: { name: true, code: true, attendanceRadius: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary counts for the filtered date
    const summary = {
      totalRecords: attendances.length,
      present: attendances.filter((a) => a.status === "PRESENT").length,
      late: attendances.filter((a) => a.status === "LATE").length,
      leave: attendances.filter((a) => a.status === "LEAVE").length,
      absent: attendances.filter((a) => a.status === "ABSENT").length,
      suspicious: attendances.filter((a) => a.status === "SUSPICIOUS" || a.isSuspicious).length,
    };

    return NextResponse.json({ attendances, summary });
  } catch (error) {
    console.error("Attendance list error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { attendanceId, status, notes, checkInTime, checkOutTime } = await req.json();

    if (!attendanceId) {
      return NextResponse.json({ error: "attendanceId is required" }, { status: 400 });
    }

    const previous = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { employee: true },
    });

    if (!previous) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: status || previous.status,
        notes: notes !== undefined ? notes : previous.notes,
        checkInTime: checkInTime ? new Date(checkInTime) : previous.checkInTime,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : previous.checkOutTime,
        modifiedByAdmin: true,
        modifiedByUserId: session.userId,
      },
    });

    // Immutable Audit Log entry
    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "ATTENDANCE_OVERRIDE",
      resourceType: "ATTENDANCE",
      resourceId: attendanceId,
      details: `Modified attendance for ${previous.employee.firstName} ${previous.employee.lastName} on ${previous.date}. Reason: ${notes || "Administrative correction"}`,
      previousValue: JSON.stringify({ status: previous.status, notes: previous.notes }),
      newValue: JSON.stringify({ status: updated.status, notes: updated.notes }),
    });

    return NextResponse.json({ success: true, attendance: updated });
  } catch (error) {
    console.error("Attendance update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
