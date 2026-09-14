import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "ALL"; // MY, DEPARTMENT, OFFICE, ALL
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const whereClause: any = {};

    if (scope === "MY" && session.employeeId) {
      whereClause.assignedToId = session.employeeId;
    } else if (scope === "OFFICE" && session.officeId) {
      whereClause.officeId = session.officeId;
    } else if (scope === "DEPARTMENT" && session.departmentId) {
      whereClause.departmentId = session.departmentId;
    }

    if (status && status !== "ALL") whereClause.status = status;
    if (priority && priority !== "ALL") whereClause.priority = priority;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            designation: true,
          },
        },
        office: { select: { name: true, code: true } },
        department: { select: { name: true, code: true } },
        createdBy: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Tasks fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, assignedToId, priority, dueDate, officeId, departmentId } =
      await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        priority: priority || "MEDIUM",
        status: "TODO",
        assignedToId: assignedToId || null,
        createdById: session.userId,
        officeId: officeId || session.officeId || null,
        departmentId: departmentId || session.departmentId || null,
        dueDate: dueDate || null,
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true, userId: true } },
      },
    });

    // Notify assigned employee
    if (task.assignedTo?.userId && task.assignedTo.userId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: task.assignedTo.userId,
          title: "New Task Assigned",
          message: `${session.name} assigned you: "${title}" (Priority: ${task.priority})`,
          type: "TASK",
          linkUrl: "/tasks",
        },
      });
    }

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
