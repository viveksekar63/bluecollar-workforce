import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  try {
    const accessToken = request.cookies.get("worktrust_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { path = [] } = await context.params;
    const suffix = path.length ? `/${path.join("/")}` : "";
    const url = `${BACKEND_URL}/verification${suffix}${request.nextUrl.search}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text();

    const response = await fetch(url, {
      method: request.method,
      headers,
      body: body || undefined,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Verification API proxy error:", error);

    return NextResponse.json(
      { message: "Unable to connect to verification service" },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, context);
}
