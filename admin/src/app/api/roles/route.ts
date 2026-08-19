import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

export async function GET(
  request: NextRequest,
) {
  try {
    const accessToken = request.cookies.get(
      "worktrust_access_token",
    )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          message: "Authentication required",
        },
        {
          status: 401,
        },
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/roles`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },

        cache: "no-store",
      },
    );

    const data = await response
      .json()
      .catch(() => []);

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Roles API error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Unable to connect to roles service",
      },
      {
        status: 503,
      },
    );
  }
}