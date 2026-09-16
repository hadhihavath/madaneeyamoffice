import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "⚠️ SECURITY WARNING: JWT_SECRET is not defined in environment variables! Please set a strong 256-bit secret in your production .env file."
      );
    }
    return "ceem-madaneeyam-office-jwt-secret-key-2026";
  }
  return secret;
}

const COOKIE_NAME = "ceem_session_token";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  employeeId?: string;
  officeId?: string;
  departmentId?: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated session from request cookies.
 */
export async function getSessionUser(): Promise<(TokenPayload & { avatarUrl?: string | null }) | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // Fetch current status to ensure user isn't deactivated or suspended
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          officeId: true,
          departmentId: true,
          avatarUrl: true,
          designation: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee?.id,
    officeId: user.employee?.officeId,
    departmentId: user.employee?.departmentId,
    name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email,
    avatarUrl: user.employee?.avatarUrl,
  };
}

/**
 * Checks role-based access for an action.
 */
export function hasPermission(
  userRole: string,
  allowedRoles: string[]
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return allowedRoles.includes(userRole);
}

export const AUTH_COOKIE = COOKIE_NAME;
