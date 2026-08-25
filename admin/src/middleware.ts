import { NextRequest, NextResponse } from "next/server";

const ADMIN_PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
] as const;

const EMPLOYER_PUBLIC_PATHS = [
  "/employer/login",
  "/api/auth/employer/login",
  "/api/auth/employer/logout",
  "/api/auth/employer/refresh",
] as const;

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectToLogin(
  request: NextRequest,
  loginPath: string,
) {
  const loginUrl = new URL(loginPath, request.url);

  loginUrl.searchParams.set(
    "returnUrl",
    request.nextUrl.pathname,
  );

  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * ---------------------------------------------------------
   * Employer authentication
   * ---------------------------------------------------------
   */

  if (matchesPath(pathname, EMPLOYER_PUBLIC_PATHS)) {
    /*
     * Employer login/logout/refresh APIs and login page
     * must remain accessible without an employer token.
     */
    return NextResponse.next();
  }

  if (pathname === "/employer" || pathname.startsWith("/employer/")) {
    const employerAccessToken = request.cookies.get(
      "worktrust_employer_access_token",
    )?.value;

    if (!employerAccessToken) {
      return redirectToLogin(request, "/employer/login");
    }

    return NextResponse.next();
  }

  /*
   * ---------------------------------------------------------
   * Admin authentication
   * ---------------------------------------------------------
   */

  if (matchesPath(pathname, ADMIN_PUBLIC_PATHS)) {
    /*
     * If admin is already logged in and opens /login,
     * redirect to admin dashboard.
     */
    if (
      pathname === "/login" &&
      request.cookies.has("worktrust_access_token")
    ) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
    }

    return NextResponse.next();
  }

  /*
   * Protected admin application routes
   */

  const adminAccessToken = request.cookies.get(
    "worktrust_access_token",
  )?.value;

  if (!adminAccessToken) {
    return redirectToLogin(request, "/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Admin application
     */
    "/dashboard/:path*",
    "/users/:path*",
    "/roles/:path*",
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

    /*
     * Employer application
     */
    "/employer/:path*",

    /*
     * Authentication APIs
     */
    "/api/auth/:path*",
  ],
};