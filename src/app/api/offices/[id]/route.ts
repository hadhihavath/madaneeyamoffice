import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const officeId = params.id;
    const body = await req.json();

    const previous = await prisma.office.findUnique({ where: { id: officeId } });
    if (!previous) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    const updated = await prisma.office.update({
      where: { id: officeId },
      data: {
        name: body.name || previous.name,
        address: body.address !== undefined ? body.address : previous.address,
        latitude: body.latitude !== undefined ? Number(body.latitude) : previous.latitude,
        longitude: body.longitude !== undefined ? Number(body.longitude) : previous.longitude,
        attendanceRadius:
          body.attendanceRadius !== undefined
            ? Number(body.attendanceRadius)
            : previous.attendanceRadius,
        status: body.status || previous.status,
        managerId: body.managerId !== undefined ? body.managerId : previous.managerId,
        phone: body.phone !== undefined ? body.phone : previous.phone,
        email: body.email !== undefined ? body.email : previous.email,
      },
    });

    await logAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorEmail: session.email,
      action: "OFFICE_UPDATED",
      resourceType: "OFFICE",
      resourceId: officeId,
      details: `Updated office ${previous.name}: Radius changed from ${previous.attendanceRadius}m to ${updated.attendanceRadius}m`,
      previousValue: JSON.stringify(previous),
      newValue: JSON.stringify(updated),
    });

    return NextResponse.json({ success: true, office: updated });
  } catch (error) {
    console.error("Office update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
