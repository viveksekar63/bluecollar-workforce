import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

export async function GET(request: NextRequest) {
  const accessToken =
    request.cookies.get(
      "worktrust_access_token",
    )?.value;

  if (!accessToken) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const response = await fetch(
    `${BACKEND_URL}/auth/admin/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  return NextResponse.json(
    data,
    {
      status: response.status,
    },
  );
}