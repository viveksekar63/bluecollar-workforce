import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Invalid email or password" },
        { status: response.status }
      );
    }

    const token = data.accessToken || data.access_token || data.token;
    if (!token) {
      return NextResponse.json(
        { message: "Login succeeded but the API did not return an access token" },
        { status: 502 }
      );
    }

    const result = NextResponse.json({ user: data.user ?? null });
    result.cookies.set("worktrust_access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return result;
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the authentication service" },
      { status: 503 }
    );
  }
}
