import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !session.employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const todayAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.employeeId,
          date: todayStr,
        },
      },
      include: {
        office: { select: { name: true, code: true, attendanceRadius: true, latitude: true, longitude: true } },
      },
    });

    const recentRecords = await prisma.attendance.findMany({
      where: { employeeId: session.employeeId },
      orderBy: { date: "desc" },
      take: 30,
      include: {
        office: { select: { name: true, code: true } },
      },
    });

    // Compute basic month stats
    const presentCount = recentRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "LATE"
    ).length;
    const lateCount = recentRecords.filter((r) => r.status === "LATE").length;
    const leaveCount = recentRecords.filter((r) => r.status === "LEAVE").length;

    return NextResponse.json({
      today: todayAttendance,
      history: recentRecords,
      stats: {
        presentCount,
        lateCount,
        leaveCount,
        totalRecorded: recentRecords.length,
      },
    });
  } catch (error) {
    console.error("My attendance error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
