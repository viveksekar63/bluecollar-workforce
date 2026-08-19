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

  if (refreshToken) {
    try {
      await fetch(
        `${BACKEND_URL}/auth/admin/logout`,
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
    } catch {
      /*
       * Even if backend logout fails,
       * clear the browser authentication.
       */
    }
  }

  const result = NextResponse.json({
    message: "Logged out successfully",
  });

  result.cookies.delete(
    "worktrust_access_token",
  );

  result.cookies.delete(
    "worktrust_refresh_token",
  );

  return result;
}