import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Channels: #general, user's office channel, user's department channel, or channels user is member of
    const conversations = await prisma.conversation.findMany({
      include: {
        office: { select: { name: true, code: true } },
        department: { select: { name: true, code: true } },
        members: {
          include: {
            user: {
              include: {
                employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              include: {
                employee: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Conversations error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, name, description, targetUserId } = await req.json();

    if (type === "DIRECT" && targetUserId) {
      // Find existing DM between these two users
      const existing = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { userId: session.userId } } },
            { members: { some: { userId: targetUserId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                include: {
                  employee: { select: { firstName: true, lastName: true, avatarUrl: true } },
                },
              },
            },
          },
        },
      });

      if (existing) {
        return NextResponse.json({ success: true, conversation: existing });
      }

      // Create new DM
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { employee: true },
      });

      const dm = await prisma.conversation.create({
        data: {
          type: "DIRECT",
          name: targetUser?.employee
            ? `${targetUser.employee.firstName} ${targetUser.employee.lastName}`
            : targetUser?.email || "Direct Message",
          members: {
            create: [{ userId: session.userId }, { userId: targetUserId }],
          },
        },
        include: {
          members: {
            include: {
              user: {
                include: {
                  employee: { select: { firstName: true, lastName: true, avatarUrl: true } },
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ success: true, conversation: dm }, { status: 201 });
    }

    // Channel creation
    const channel = await prisma.conversation.create({
      data: {
        type: "CHANNEL",
        name: name.startsWith("#") ? name : `#${name}`,
        description,
        members: {
          create: [{ userId: session.userId }],
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({ success: true, conversation: channel }, { status: 201 });
  } catch (error) {
    console.error("Conversation creation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
