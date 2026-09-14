import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetAudience: "EVERYONE" },
          ...(session.officeId ? [{ officeId: session.officeId }] : []),
          ...(session.departmentId ? [{ departmentId: session.departmentId }] : []),
        ],
      },
      include: {
        author: {
          include: {
            employee: { select: { firstName: true, lastName: true, designation: true } },
          },
        },
        office: { select: { name: true, code: true } },
        department: { select: { name: true, code: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Announcements error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, priority, targetAudience, officeId, departmentId, isPinned } =
      await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || "NORMAL",
        targetAudience: targetAudience || "EVERYONE",
        officeId: targetAudience === "SPECIFIC_OFFICE" ? officeId || session.officeId : null,
        departmentId: targetAudience === "SPECIFIC_DEPARTMENT" ? departmentId : null,
        authorId: session.userId,
        isPinned: !!isPinned,
      },
      include: {
        author: {
          include: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    console.error("Announcement creation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
