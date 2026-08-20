import {
  NextRequest,
  NextResponse,
} from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

const ACCESS_TOKEN_COOKIE =
  "worktrust_access_token";

const REFRESH_TOKEN_COOKIE =
  "worktrust_refresh_token";

interface BackendRequestOptions
  extends RequestInit {
  headers?: HeadersInit;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user?: unknown;
}

function getAccessToken(
  request: NextRequest,
) {
  return request.cookies.get(
    ACCESS_TOKEN_COOKIE,
  )?.value;
}

function getRefreshToken(
  request: NextRequest,
) {
  return request.cookies.get(
    REFRESH_TOKEN_COOKIE,
  )?.value;
}

function applyAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    },
  );

  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
}

function clearAuthCookies(
  response: NextResponse,
) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    },
  );

  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 0,
    },
  );
}

function authenticationRequiredResponse(
  message = "Authentication required",
) {
  return NextResponse.json(
    {
      message,
      code: "AUTHENTICATION_REQUIRED",
    },
    {
      status: 401,
    },
  );
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshResponse | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/auth/admin/refresh`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          refreshToken,
        }),

        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data =
      await response
        .json()
        .catch(() => null);

    if (
      !data?.accessToken ||
      !data?.refreshToken
    ) {
      return null;
    }

    return data as RefreshResponse;
  } catch (error) {
    console.error(
      "Refresh token request failed:",
      error,
    );

    return null;
  }
}

async function performBackendRequest(
  path: string,
  accessToken: string,
  options: BackendRequestOptions,
) {
  const headers = new Headers(
    options.headers,
  );

  headers.set(
    "Authorization",
    `Bearer ${accessToken}`,
  );

  if (
    !headers.has(
      "Content-Type",
    ) &&
    options.body
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  return fetch(
    `${BACKEND_URL}${path}`,
    {
      ...options,
      headers,
      cache: "no-store",
    },
  );
}

export async function backendRequest(
  request: NextRequest,
  path: string,
  options: BackendRequestOptions = {},
) {
  const accessToken =
    getAccessToken(request);

  if (!accessToken) {
    return authenticationRequiredResponse();
  }

  let response =
    await performBackendRequest(
      path,
      accessToken,
      options,
    );

  let refreshed = false;
  let newAccessToken = "";
  let newRefreshToken = "";

  /*
   * Access token expired.
   *
   * Try refresh-token rotation once.
   */
  if (response.status === 401) {
    const refreshToken =
      getRefreshToken(request);

    if (!refreshToken) {
      const result =
        authenticationRequiredResponse(
          "Session expired",
        );

      clearAuthCookies(result);

      return result;
    }

    const refreshedTokens =
      await refreshAccessToken(
        refreshToken,
      );

    if (!refreshedTokens) {
      const result =
        authenticationRequiredResponse(
          "Session expired. Please sign in again.",
        );

      clearAuthCookies(result);

      return result;
    }

    newAccessToken =
      refreshedTokens.accessToken;

    newRefreshToken =
      refreshedTokens.refreshToken;

    refreshed = true;

    /*
     * Retry the original request
     * using the new access token.
     */
    response =
      await performBackendRequest(
        path,
        newAccessToken,
        options,
      );

    /*
     * Refresh succeeded but the
     * retry still returned 401.
     *
     * Treat the session as invalid.
     */
    if (response.status === 401) {
      const result =
        authenticationRequiredResponse(
          "Session expired. Please sign in again.",
        );

      clearAuthCookies(result);

      return result;
    }
  }

  const data =
    await response
      .json()
      .catch(() => ({}));

  const result =
    NextResponse.json(data, {
      status: response.status,
    });

  if (refreshed) {
    applyAuthCookies(
      result,
      newAccessToken,
      newRefreshToken,
    );
  }

  return result;
}