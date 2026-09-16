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

    const { settings, officeRadiuses, officeGeofences } = await req.json();

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

    // Update geofences (radius and/or coordinates) if supplied
    if (officeGeofences && Array.isArray(officeGeofences)) {
      for (const item of officeGeofences) {
        if (item.officeId) {
          const oldOffice = await prisma.office.findUnique({ where: { id: item.officeId } });
          if (!oldOffice) continue;

          const dataToUpdate: any = {};
          if (item.radius !== undefined) dataToUpdate.attendanceRadius = Number(item.radius);
          if (item.latitude !== undefined) dataToUpdate.latitude = Number(item.latitude);
          if (item.longitude !== undefined) dataToUpdate.longitude = Number(item.longitude);

          const updatedOffice = await prisma.office.update({
            where: { id: item.officeId },
            data: dataToUpdate,
          });

          const changes: string[] = [];
          if (item.radius !== undefined && oldOffice.attendanceRadius !== updatedOffice.attendanceRadius) {
            changes.push(`radius ${oldOffice.attendanceRadius}m -> ${updatedOffice.attendanceRadius}m`);
          }
          if (item.latitude !== undefined || item.longitude !== undefined) {
            changes.push(`coordinates (${oldOffice.latitude.toFixed(5)}, ${oldOffice.longitude.toFixed(5)}) -> (${updatedOffice.latitude.toFixed(5)}, ${updatedOffice.longitude.toFixed(5)})`);
          }

          if (changes.length > 0) {
            await logAuditEvent({
              actorId: session.userId,
              actorName: session.name,
              actorEmail: session.email,
              action: "GEOFENCE_CONFIGURED",
              resourceType: "OFFICE",
              resourceId: item.officeId,
              details: `Calibrated geofence for ${updatedOffice.name}: ${changes.join(", ")}`,
              previousValue: JSON.stringify({
                radius: oldOffice.attendanceRadius,
                lat: oldOffice.latitude,
                lng: oldOffice.longitude,
              }),
              newValue: JSON.stringify({
                radius: updatedOffice.attendanceRadius,
                lat: updatedOffice.latitude,
                lng: updatedOffice.longitude,
              }),
            });
          }
        }
      }
    } else if (officeRadiuses && Array.isArray(officeRadiuses)) {
      // Legacy radius matrix update
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
