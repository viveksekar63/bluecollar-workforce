# WorkTrust Admin

## Authentication protection

Protected pages use two layers:

1. `middleware.ts` redirects unauthenticated requests before the page is rendered.
2. `src/components/layout/admin-shell.tsx` performs a server-side cookie check and calls `redirect("/login")` if the cookie is missing.

Authentication cookie:

```text
worktrust_access_token
```

The login endpoint sets this as an HttpOnly cookie after the NestJS login API returns an access token.

## Start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/login
```

Do NOT expect `/dashboard` to be public. Without `worktrust_access_token`, opening `/dashboard` directly redirects to `/login?returnUrl=/dashboard`.

## Required NestJS API

```text
POST /api/v1/auth/login
```

It must return one of:

```json
{ "accessToken": "...", "user": { "id": "...", "role": "SUPER_ADMIN" } }
```

The frontend stores the token in an HttpOnly cookie; it is not stored in localStorage.
