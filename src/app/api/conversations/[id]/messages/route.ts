import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                designation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, attachmentUrl, attachmentType } = await req.json();

    if (!content && !attachmentUrl) {
      return NextResponse.json({ error: "Content or attachment required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: session.userId,
        content: content || "",
        attachmentUrl,
        attachmentType,
        reactions: "[]",
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
