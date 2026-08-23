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
          "Content-Type":
            "application/json",
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
        message:
          "Unable to connect to roles service",
      },
      {
        status: 503,
      },
    );
  }
}

export async function POST(
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
          message: "Authentication required",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body?.description === "string"
        ? body.description.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Role name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          message:
            "Role name must not exceed 100 characters",
        },
        {
          status: 400,
        },
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        {
          message:
            "Role description must not exceed 500 characters",
        },
        {
          status: 400,
        },
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/roles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
        }),
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
            "Unable to create role",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(
      data,
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create role API error:",
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