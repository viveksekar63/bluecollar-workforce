import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"] as const;

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes are allowed without authentication.
  if (isPublicPath(pathname)) {
    if (pathname === "/login" && request.cookies.has("worktrust_access_token")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // All application pages are protected.
  const token = request.cookies.get("worktrust_access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workers/:path*",
    "/employers/:path*",
    "/jobs/:path*",
    "/applications/:path*",
    "/verification/:path*",
    "/attendance/:path*",
    "/payments/:path*",
    "/reports/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/login",
  ],
};
