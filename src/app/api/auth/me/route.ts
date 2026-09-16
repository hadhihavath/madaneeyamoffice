import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      employee: {
        include: {
          office: true,
          department: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const isDefaultPassword = await bcrypt.compare("Password123!", user.passwordHash);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isDefaultPassword,
      employee: user.employee,
    },
  });
}
