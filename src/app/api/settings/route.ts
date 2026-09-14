import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findFirst({
      include: {
        offices: {
          select: {
            id: true,
            name: true,
            code: true,
            attendanceRadius: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    return NextResponse.json({
      organization: org,
      settings: org?.settings ? JSON.parse(org.settings) : {},
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden. Super Admin only." }, { status: 403 });
    }

    const { settings, officeRadiuses } = await req.json();

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 500 });
    }

    if (settings) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { settings: JSON.stringify(settings) },
      });
    }

    // Update individual office radiuses if supplied
    if (officeRadiuses && Array.isArray(officeRadiuses)) {
      for (const item of officeRadiuses) {
        if (item.officeId && item.radius) {
          const oldOffice = await prisma.office.findUnique({ where: { id: item.officeId } });
          const updatedOffice = await prisma.office.update({
            where: { id: item.officeId },
            data: { attendanceRadius: Number(item.radius) },
          });

          await logAuditEvent({
            actorId: session.userId,
            actorName: session.name,
            actorEmail: session.email,
            action: "RADIUS_CONFIGURED",
            resourceType: "SETTINGS",
            resourceId: item.officeId,
            details: `Adjusted attendance geofence radius for ${updatedOffice.name} from ${oldOffice?.attendanceRadius}m to ${updatedOffice.attendanceRadius}m`,
            previousValue: `${oldOffice?.attendanceRadius}`,
            newValue: `${updatedOffice.attendanceRadius}`,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
