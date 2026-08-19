# WorkTrust Admin Authentication

The Admin UI is now protected by an HttpOnly authentication cookie.

## Flow

```text
Browser
  ↓ POST /api/auth/login
Next.js login route
  ↓ POST /auth/login
NestJS
  ↓ accessToken
Next.js
  ↓ Set-Cookie: worktrust_access_token (HttpOnly)
Browser
```

Protected page request:

```text
Browser → /dashboard
           ↓
       middleware.ts
           ↓ token exists?
        yes → dashboard
        no  → /login
```

API requests use the Next.js backend proxy:

```text
Browser → /api/backend/workers
              ↓ reads HttpOnly cookie
          Next.js proxy
              ↓ Authorization: Bearer <token>
          NestJS /api/v1/workers
```

This avoids exposing the JWT to browser JavaScript and prevents direct unauthenticated access to the Admin UI.

## NestJS requirement

The backend must expose:

```http
POST /api/v1/auth/login
```

and return one of:

```json
{ "accessToken": "...", "user": {} }
```

or

```json
{ "token": "...", "user": {} }
```

All protected backend routes should use the NestJS JWT guard.
