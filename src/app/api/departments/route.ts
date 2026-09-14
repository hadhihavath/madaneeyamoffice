import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            employmentStatus: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const enriched = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      managerId: d.managerId,
      totalEmployees: d.employees.filter((e) => e.employmentStatus === "ACTIVE").length,
    }));

    return NextResponse.json({ departments: enriched });
  } catch (error) {
    console.error("Departments fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, ["SUPER_ADMIN", "ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, code, description } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code required" }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 500 });
    }

    const department = await prisma.department.create({
      data: {
        organizationId: org.id,
        name,
        code: code.toUpperCase().trim(),
        description,
      },
    });

    // Create channel
    await prisma.conversation.create({
      data: {
        type: "CHANNEL",
        name: `#${code.toLowerCase()}`,
        description: `${name} department channel`,
        departmentId: department.id,
        isDepartmentChannel: true,
      },
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error) {
    console.error("Department creation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
