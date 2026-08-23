import {
  NextRequest,
  NextResponse,
} from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

function getAccessToken(
  request: NextRequest,
) {
  return request.cookies.get(
    "worktrust_access_token",
  )?.value;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const accessToken =
      getAccessToken(request);

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

    const { id } =
      await context.params;

    const response = await fetch(
      `${BACKEND_URL}/roles/${encodeURIComponent(id)}`,
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
            "Unable to load role",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Role details API error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to roles service",
      },
      {
        status: 503,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const accessToken =
      getAccessToken(request);

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

    const { id } =
      await context.params;

    const body =
      await request.json();

    const response = await fetch(
      `${BACKEND_URL}/roles/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(body),
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
            "Unable to update role",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Update role API error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to connect to roles service",
      },
      {
        status: 503,
      },
    );
  }
}