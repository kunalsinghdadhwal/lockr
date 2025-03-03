import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/lib/auth";
import { betterFetch } from "@better-fetch/fetch";

const authRoutes = ["/sign-in", "/sign-up"];
const passwordRoutes = ["/forgot-password", "/reset-password"];
const dashboardRoutes = ["/dashboard"];
const adminRoutes = ["/admin"];

export default async function authMiddleware(req: NextRequest) {
  const pathName = req.nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(pathName);
  const isPasswordRoute = passwordRoutes.includes(pathName);
  const isDashboardRoute = dashboardRoutes.includes(pathName);
  const isAdminRoute = adminRoutes.includes(pathName);
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: process.env.BETTER_AUTH_URL,
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    }
  );
  if (!session) {
    if (isDashboardRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (isAuthRoute || isPasswordRoute) {
      return NextResponse.next();
    }

    return NextResponse.next();
  }
  if (session && (isAuthRoute || isPasswordRoute)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAdminRoute && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (session && isDashboardRoute) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|tools/.*).*)"],
};
