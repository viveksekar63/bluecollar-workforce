import {
  NextRequest,
  NextResponse,
} from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
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

    const { id } = await context.params;

    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/users/${id}/roles`,
      {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Update user roles API error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Unable to update user roles",
      },
      {
        status: 503,
      },
    );
  }
}