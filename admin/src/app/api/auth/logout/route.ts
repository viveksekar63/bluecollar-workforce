import { NextResponse } from "next/server";

export async function POST() {
  const result = NextResponse.json({ success: true });
  result.cookies.set("worktrust_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return result;
}
