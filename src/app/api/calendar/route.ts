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
    const officeId = searchParams.get("officeId");

    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { officeId: null },
          ...(officeId ? [{ officeId }] : session.officeId ? [{ officeId: session.officeId }] : []),
        ],
      },
      include: {
        office: { select: { name: true, code: true } },
        department: { select: { name: true, code: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, eventType, startDate, endDate, startTime, endTime, officeId, location } =
      await req.json();

    if (!title || !startDate) {
      return NextResponse.json({ error: "Title and startDate required" }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        eventType: eventType || "MEETING",
        startDate,
        endDate,
        startTime,
        endTime,
        officeId: officeId || null,
        location,
      },
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Calendar create error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
