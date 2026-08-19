export async function refreshAuth() {
  const response = await fetch(
    "/api/auth/refresh",
    {
      method: "POST",
      credentials: "include",
    },
  );

  return response.ok;
}

export async function logout() {
  await fetch(
    "/api/auth/logout",
    {
      method: "POST",
      credentials: "include",
    },
  );

  window.location.href = "/login";
}