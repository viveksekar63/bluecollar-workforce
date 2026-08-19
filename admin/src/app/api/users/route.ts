import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;

    const query = new URLSearchParams();

    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const roleId = searchParams.get("roleId");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    if (search) {
      query.set("search", search);
    }

    if (status) {
      query.set("status", status);
    }

    if (roleId) {
      query.set("roleId", roleId);
    }

    if (page) {
      query.set("page", page);
    }

    if (limit) {
      query.set("limit", limit);
    }

    const queryString = query.toString();

    const response = await fetch(
      `${BACKEND_URL}/users${
        queryString ? `?${queryString}` : ""
      }`,
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
      .catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Users API error:", error);

    return NextResponse.json(
      {
        message: "Unable to connect to users service",
      },
      {
        status: 503,
      },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/users`,
      {
        method: "POST",

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

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "Create user API error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Unable to create user",
      },
      {
        status: 503,
      },
    );
  }
}