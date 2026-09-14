import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: body.status !== undefined ? body.status : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        dueDate: body.dueDate !== undefined ? body.dueDate : undefined,
        assignedToId: body.assignedToId !== undefined ? body.assignedToId : undefined,
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Task delete error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
