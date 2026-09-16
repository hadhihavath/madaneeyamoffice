import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const PUBLIC_FILE_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets and brand files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE_EXTENSIONS.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("ceem_session_token")?.value;

  // 2. Handle /login route
  if (pathname === "/login") {
    // If already authenticated, redirect to home dashboard
    if (sessionToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return await updateSession(request);
  }

  // 3. Allow public auth APIs
  const isPublicAuthApi =
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/demo-switch" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/me";

  // 4. Protect API routes
  if (pathname.startsWith("/api/")) {
    if (!sessionToken && !isPublicAuthApi) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return await updateSession(request);
  }

  // 5. Protect all application pages
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
