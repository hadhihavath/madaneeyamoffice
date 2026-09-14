import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportFormat = searchParams.get("format"); // "csv" or json
    let officeId = searchParams.get("officeId");

    if (session.role === "OFFICE_MANAGER" && session.officeId) {
      officeId = session.officeId;
    }

    const offices = await prisma.office.findMany({
      where: officeId ? { id: officeId } : undefined,
      include: {
        employees: {
          include: { department: true },
        },
        attendances: true,
        leaveRequests: true,
      },
    });

    const officeMetrics = offices.map((o) => {
      const activeEmps = o.employees.filter((e) => e.employmentStatus === "ACTIVE");
      const totalPresent = o.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      const totalLate = o.attendances.filter((a) => a.status === "LATE").length;
      const totalLeave = o.leaveRequests.filter((l) => l.status === "APPROVED").length;

      return {
        officeId: o.id,
        officeName: o.name,
        officeCode: o.code,
        city: o.city,
        employeeCount: activeEmps.length,
        presentCount: totalPresent,
        lateCount: totalLate,
        leaveCount: totalLeave,
        attendanceRate: activeEmps.length > 0 ? Math.round((totalPresent / activeEmps.length) * 100) : 0,
      };
    });

    // Recent attendances for export
    const attendances = await prisma.attendance.findMany({
      where: officeId ? { officeId } : undefined,
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            office: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    if (exportFormat === "csv") {
      const csvHeader = "Date,Employee ID,Employee Name,Office,Department,Status,Check In,Check Out,Duration (Mins),Distance (Meters)\n";
      const csvRows = attendances.map((a) => {
        const empName = `"${a.employee.firstName} ${a.employee.lastName}"`;
        const officeName = `"${a.employee.office.name}"`;
        const deptName = `"${a.employee.department.name}"`;
        const checkIn = a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString() : "";
        const checkOut = a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString() : "";
        return `${a.date},${a.employee.employeeId},${empName},${officeName},${deptName},${a.status},${checkIn},${checkOut},${a.workDurationMinutes || 0},${a.distanceMeters || 0}`;
      }).join("\n");

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ceem_attendance_report_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      officeMetrics,
      totalOffices: offices.length,
      totalEmployees: offices.reduce((sum, o) => sum + o.employees.length, 0),
      totalAttendanceRecords: attendances.length,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
