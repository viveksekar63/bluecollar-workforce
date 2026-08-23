import {
  NextRequest,
  NextResponse,
} from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

export async function GET(
  request: NextRequest,
) {
  try {
    const accessToken =
      request.cookies.get(
        "worktrust_access_token",
      )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          message:
            "Authentication required",
        },
        {
          status: 401,
        },
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/roles/permissions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data ?? {
          message:
            "Unable to load permissions",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Permissions API error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to permissions service",
      },
      {
        status: 503,
      },
    );
  }
}