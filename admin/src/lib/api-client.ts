import { refreshAuth } from "./auth-client";

let refreshing = false;
let refreshPromise: Promise<boolean> | null =
  null;

async function refreshOnce() {
  if (!refreshing) {
    refreshing = true;

    refreshPromise = refreshAuth()
      .finally(() => {
        refreshing = false;
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  let response = await fetch(
    input,
    {
      ...init,
      credentials: "include",
    },
  );

  if (response.status !== 401) {
    return response;
  }

  const refreshed =
    await refreshOnce();

  if (!refreshed) {
    window.location.href = "/login";
    return response;
  }

  response = await fetch(
    input,
    {
      ...init,
      credentials: "include",
    },
  );

  return response;
}