import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN"])) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get("resourceType");
    const search = searchParams.get("search");

    const whereClause: any = {};
    if (resourceType && resourceType !== "ALL") {
      whereClause.resourceType = resourceType;
    }

    if (search) {
      whereClause.OR = [
        { actorName: { contains: search } },
        { details: { contains: search } },
        { action: { contains: search } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
