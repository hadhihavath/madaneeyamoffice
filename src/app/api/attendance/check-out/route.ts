import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !session.employeeId) {
      return NextResponse.json(
        { error: "Unauthorized. Valid employee session required." },
        { status: 401 }
      );
    }

    const { latitude, longitude } = await req.json();
    const todayStr = new Date().toISOString().split("T")[0];

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.employeeId,
          date: todayStr,
        },
      },
    });

    if (!attendance || !attendance.checkInTime) {
      return NextResponse.json(
        { error: "No active check-in record found for today." },
        { status: 400 }
      );
    }

    if (attendance.checkOutTime) {
      return NextResponse.json(
        { error: "You have already checked out today." },
        { status: 400 }
      );
    }

    const now = new Date();
    const durationMinutes = Math.round(
      (now.getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60)
    );

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: now,
        checkOutLat: latitude ? Number(latitude) : null,
        checkOutLon: longitude ? Number(longitude) : null,
        workDurationMinutes: durationMinutes,
      },
    });

    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;

    await prisma.notification.create({
      data: {
        userId: session.userId,
        title: "Attendance Checked Out",
        message: `Checked out successfully. Working time today: ${hours}h ${mins}m.`,
        type: "ATTENDANCE",
        linkUrl: "/attendance",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Checked out successfully. Total working time: ${hours}h ${mins}m.`,
      attendance: updated,
      formattedDuration: `${hours}h ${mins}m`,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Failed to record check-out." },
      { status: 500 }
    );
  }
}
