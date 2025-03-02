import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth";

const authRoutes = ["/sign-in", "/sign-up"];
const passwordRoutes = ["/forgot-password", "/reset-password"];
const dashboardRoutes = ["/dashboard"];

export default async function authMiddleware(req: NextRequest) {
  const pathName = req.nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(pathName);
  const isPasswordRoute = passwordRoutes.includes(pathName);
  const isDashboardRoute = dashboardRoutes.includes(pathName);
  const cookies = getSessionCookie(req);
  if (!cookies) {
    if (isDashboardRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (isAuthRoute || isPasswordRoute) {
      return NextResponse.next();
    }

    return NextResponse.next();
  }
  if (cookies && (isAuthRoute || isPasswordRoute)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
