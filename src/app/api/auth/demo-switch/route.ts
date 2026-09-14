import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const name = user.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : user.email;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id,
      officeId: user.employee?.officeId,
      departmentId: user.employee?.departmentId,
      name,
    });

    const response = NextResponse.json({
      success: true,
      message: `Switched to persona: ${name} (${user.role})`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        employee: user.employee,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Demo switch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
