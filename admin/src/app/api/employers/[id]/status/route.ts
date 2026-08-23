import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api/v1';

function getAccessToken(request: NextRequest) {
  return request.cookies.get('worktrust_access_token')?.value;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  try {
    const response = await fetch(`${BACKEND_URL}/employers/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await request.json()),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Employer status API error:', error);
    return NextResponse.json(
      { message: 'Unable to connect to employers service' },
      { status: 503 },
    );
  }
}
