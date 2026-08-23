import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/auth/employer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Invalid email/phone or password" },
        { status: response.status },
      );
    }

    if (!data.accessToken || !data.refreshToken) {
      return NextResponse.json(
        { message: "Login succeeded but authentication tokens were not returned" },
        { status: 502 },
      );
    }

    const result = NextResponse.json({ user: data.user ?? null });

    result.cookies.set("worktrust_employer_access_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    result.cookies.set("worktrust_employer_refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/employer",
      maxAge: 60 * 60 * 24 * 7,
    });

    return result;
  } catch (error) {
    console.error("Employer login error:", error);
    return NextResponse.json(
      { message: "Unable to connect to the authentication service" },
      { status: 503 },
    );
  }
}
