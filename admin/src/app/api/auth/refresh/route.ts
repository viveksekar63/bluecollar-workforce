import {
  NextRequest,
  NextResponse,
} from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

export async function POST(
  request: NextRequest,
) {
  const refreshToken =
    request.cookies.get(
      "worktrust_refresh_token",
    )?.value;

  if (!refreshToken) {
    return NextResponse.json(
      {
        message: "Refresh token missing",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/auth/admin/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
        cache: "no-store",
      },
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      const result = NextResponse.json(
        {
          message:
            data.message ||
            "Refresh token expired",
        },
        {
          status: response.status,
        },
      );

      result.cookies.delete(
        "worktrust_access_token",
      );

      result.cookies.delete(
        "worktrust_refresh_token",
      );

      return result;
    }

    const result = NextResponse.json({
      user: data.user ?? null,
    });

    result.cookies.set(
      "worktrust_access_token",
      data.accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      },
    );

    /*
     * IMPORTANT:
     * Backend rotated the refresh token.
     */
    result.cookies.set(
      "worktrust_refresh_token",
      data.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    return result;
  } catch {
    return NextResponse.json(
      {
        message:
          "Unable to refresh authentication",
      },
      {
        status: 503,
      },
    );
  }
}