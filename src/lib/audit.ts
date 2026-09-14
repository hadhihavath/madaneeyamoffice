import { prisma } from "./prisma";

export interface CreateAuditLogParams {
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resourceType: "EMPLOYEE" | "ATTENDANCE" | "LEAVE" | "OFFICE" | "TASK" | "SETTINGS" | "ANNOUNCEMENT";
  resourceId?: string;
  details: string;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string;
}

export async function logAuditEvent(params: CreateAuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorName: params.actorName,
        actorEmail: params.actorEmail,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: params.details,
        previousValue: params.previousValue,
        newValue: params.newValue,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}
