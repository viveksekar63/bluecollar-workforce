import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api/v1';

function getAccessToken(request: NextRequest) {
  return request.cookies.get('worktrust_access_token')?.value;
}

async function proxy(request: NextRequest, method: 'GET' | 'POST') {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const url = `${BACKEND_URL}/employers${request.nextUrl.search}`;
    const body = method === 'POST' ? JSON.stringify(await request.json()) : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Employers API error:', error);

    return NextResponse.json(
      { message: 'Unable to connect to employers service' },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxy(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxy(request, 'POST');
}
