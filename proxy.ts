import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_SECRET, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));

    try {
      await jwtVerify(token, AUTH_SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  }

  if (isAuthPage && token) {
    try {
      await jwtVerify(token, AUTH_SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
