import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPrivileged = hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR"]);
    const isManager = session.role === "OFFICE_MANAGER" || session.role === "DEPARTMENT_MANAGER";

    // Filter documents based on accessRole
    const allowedRoles = ["ALL"];
    if (isManager || isPrivileged) allowedRoles.push("MANAGERS");
    if (isPrivileged) allowedRoles.push("HR", "ADMIN");

    const documents = await prisma.document.findMany({
      where: {
        accessRole: { in: allowedRoles },
      },
      include: {
        office: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Documents fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, category, fileName, fileUrl, fileSize, accessRole, officeId } = await req.json();

    if (!title || !fileName) {
      return NextResponse.json({ error: "Title and fileName required" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        title,
        category: category || "HR_POLICIES",
        fileName,
        fileUrl: fileUrl || "/brand/Madaneeyam_Logo.pdf",
        fileSize: fileSize || "1.5 MB",
        accessRole: accessRole || "ALL",
        officeId: officeId || null,
        uploadedById: session.userId,
      },
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    console.error("Document create error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
