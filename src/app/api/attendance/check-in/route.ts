import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAttendanceLocation } from "@/lib/geofence";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !session.employeeId) {
      return NextResponse.json(
        { error: "Unauthorized. Valid employee session required." },
        { status: 401 }
      );
    }

    const { latitude, longitude, accuracy, notes, deviceInfo } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "GPS latitude and longitude coordinates are required." },
        { status: 400 }
      );
    }

    // Fetch employee and assigned office details
    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      include: {
        office: true,
      },
    });

    if (!employee || !employee.office) {
      return NextResponse.json(
        { error: "Employee record or assigned office not found." },
        { status: 404 }
      );
    }

    const office = employee.office;
    const todayStr = new Date().toISOString().split("T")[0];

    // Check if employee has already checked in today
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: todayStr,
        },
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return NextResponse.json(
        {
          error: "You have already checked in today.",
          attendance: existingAttendance,
        },
        { status: 409 }
      );
    }

    // SERVER-SIDE GEOFENCE VALIDATION
    const validation = validateAttendanceLocation({
      clientLat: Number(latitude),
      clientLon: Number(longitude),
      clientAccuracy: accuracy ? Number(accuracy) : undefined,
      officeLat: office.latitude,
      officeLon: office.longitude,
      allowedRadiusMeters: office.attendanceRadius,
    });

    // If outside permitted radius, reject check-in
    if (!validation.isAllowed) {
      return NextResponse.json(
        {
          success: false,
          isAllowed: false,
          distanceMeters: validation.distanceMeters,
          allowedRadiusMeters: office.attendanceRadius,
          officeName: office.name,
          error: validation.message,
        },
        { status: 403 }
      );
    }

    // Determine status: check if late (after 09:15 AM local time)
    const now = new Date();
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    let status = isLate ? "LATE" : "PRESENT";
    if (validation.isSuspicious) {
      status = "SUSPICIOUS";
    }

    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";

    // Upsert attendance record for today
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: todayStr,
        },
      },
      update: {
        checkInTime: now,
        checkInLat: Number(latitude),
        checkInLon: Number(longitude),
        distanceMeters: validation.distanceMeters,
        locationAccuracy: accuracy ? Number(accuracy) : null,
        status,
        isSuspicious: validation.isSuspicious,
        suspiciousReason: validation.suspiciousReason,
        deviceInfo: deviceInfo || req.headers.get("user-agent")?.slice(0, 100),
        ipAddress: ip,
        notes: notes || null,
      },
      create: {
        employeeId: employee.id,
        officeId: office.id,
        date: todayStr,
        checkInTime: now,
        checkInLat: Number(latitude),
        checkInLon: Number(longitude),
        distanceMeters: validation.distanceMeters,
        locationAccuracy: accuracy ? Number(accuracy) : null,
        status,
        isSuspicious: validation.isSuspicious,
        suspiciousReason: validation.suspiciousReason,
        deviceInfo: deviceInfo || req.headers.get("user-agent")?.slice(0, 100),
        ipAddress: ip,
        notes: notes || null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.userId,
        title: "Attendance Checked In",
        message: `Successfully checked in at ${office.name} (${Math.round(validation.distanceMeters)}m from office center).`,
        type: "ATTENDANCE",
        linkUrl: "/attendance",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Checked in successfully at ${office.name}!`,
      attendance,
      validation,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to record check-in. Please try again." },
      { status: 500 }
    );
  }
}
