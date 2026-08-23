import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const token =
    request.cookies.get("worktrust_employer_access_token")?.value ||
    request.cookies.get("worktrust_access_token")?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { path } = await params;
  const incomingUrl = new URL(request.url);
  const target = `${BACKEND_URL.replace(/\/$/, "")}/${path.join("/")}${incomingUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("authorization", `Bearer ${token}`);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers();
  const responseType = response.headers.get("content-type");
  if (responseType) responseHeaders.set("content-type", responseType);

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
