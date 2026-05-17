# JWT Authentication — Design Spec

**Date:** 2026-05-17
**Author:** Yohan
**Status:** Approved (pending written-spec review)
**Source:** Bonus item from `docs/FullStack_Intern_Assessment_GlobalTNA (14 May 2026).md`, §4 line 68: *"JWT-based auth so only logged-in users can post or delete."*

## 1. Goal

Gate every state-changing job endpoint behind a valid JWT. Provide a public registration + login flow so reviewers can self-serve an account. Reads remain public — anyone can browse the board without an account.

## 2. Scope Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Which endpoints require auth? | `POST /api/jobs`, `PATCH /api/jobs/:id`, `DELETE /api/jobs/:id` (all writes). Reads stay public. |
| 2 | How are accounts created? | Public `POST /api/auth/register` endpoint with auto-login on success. No seeded demo user. |
| 3 | Ownership model | Any logged-in user can modify any job. No `createdBy` field on `JobRequest`. |
| 4 | Token storage on frontend | `localStorage` (keys `gtna_token`, `gtna_user`) + `Authorization: Bearer <token>` header. |
| 5 | Login UI surface | Separate `/login` and `/register` pages. TopBar shows email + Log out (authed) or Log in link (anon). |

## 3. Architecture

### 3.1 New / changed files

**Backend**

| File | Action | Purpose |
|---|---|---|
| `backend/src/models/User.js` | **new** | Mongoose user model. |
| `backend/src/routes/auth.js` | **new** | `POST /register`, `POST /login`, `GET /me`. |
| `backend/src/middleware/auth.js` | **new** | `requireAuth` middleware — verifies Bearer JWT, attaches `req.user`. |
| `backend/src/routes/jobs.js` | edit | Apply `requireAuth` to POST, PATCH, DELETE handlers. |
| `backend/src/server.js` | edit | Mount `auth` router at `/api/auth`. |
| `backend/package.json` | edit | Add `bcryptjs` and `jsonwebtoken` deps. |
| `backend/.env` | edit | Add `JWT_SECRET=<random hex>`. |
| `backend/.env.example` | edit | Add `JWT_SECRET=` placeholder + comment. |

**Frontend**

| File | Action | Purpose |
|---|---|---|
| `frontend/lib/auth.js` | **new** | `AuthContext`, `AuthProvider`, `useAuth()`, localStorage helpers. |
| `frontend/app/login/page.jsx` | **new** | Login form. |
| `frontend/app/register/page.jsx` | **new** | Register form. |
| `frontend/lib/api.js` | edit | Auto-attach `Authorization` header; expose `api.auth.{register,login,me}`; clear token on 401. |
| `frontend/components/TopBar.jsx` | edit | Render Login link OR user email + Logout button. |
| `frontend/app/layout.jsx` | edit | Wrap children in `<AuthProvider>`. |
| `frontend/app/jobs/[id]/page.jsx` | edit | Hide status dropdown + delete button when anon; show "Log in to manage" link instead. |
| `frontend/app/jobs/new/page.jsx` | edit | Redirect anon users to `/login?next=/jobs/new`. |

### 3.2 User model

```js
// backend/src/models/User.js
{
  email:        { type: String, required, unique, lowercase, trim, validated },
  passwordHash: { type: String, required },                  // bcryptjs, cost 10
  // timestamps: createdAt, updatedAt
}
```

Email uses the existing email regex from `JobRequest.js`, extracted into a new shared module `backend/src/lib/validators.js` and imported by both models. `passwordHash` is never returned in any API response (omit via `.toJSON` transform on the schema).

### 3.3 `JobRequest` model

**Unchanged.** No `createdBy`, no `updatedBy`.

## 4. API Contract

### 4.1 `POST /api/auth/register`

**Body:** `{ email: string, password: string }`

**Validation**
- `email` matches email regex
- `password` length ≥ 8

**Responses**
| Status | Body | Trigger |
|---|---|---|
| 201 | `{ token, user: { id, email } }` | Success — user is auto-logged-in. |
| 400 | `{ error: "Email and password are required" }` or `{ error: "Invalid email" }` or `{ error: "Password must be at least 8 characters" }` | Validation. |
| 409 | `{ error: "Email already registered" }` | Duplicate email (catch Mongoose `E11000`). |

### 4.2 `POST /api/auth/login`

**Body:** `{ email: string, password: string }`

**Responses**
| Status | Body | Trigger |
|---|---|---|
| 200 | `{ token, user: { id, email } }` | Success. |
| 400 | `{ error: "Email and password are required" }` | Missing fields. |
| 401 | `{ error: "Invalid email or password" }` | Wrong email **or** wrong password — never disclose which. |

### 4.3 `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Responses**
| Status | Body | Trigger |
|---|---|---|
| 200 | `{ user: { id, email } }` | Valid token. Returns `req.user` directly from the JWT payload (no DB lookup, consistent with §5.1). |
| 401 | `{ error: "Authentication required" }` etc. | See §5. |

Purpose: lets the frontend validate a stored token on app load before assuming it's logged in. It also serves as a useful sanity ping in the dev console.

### 4.4 Existing job endpoints — auth changes

| Endpoint | Before | After |
|---|---|---|
| `GET /api/jobs` | public | public (unchanged) |
| `GET /api/jobs/:id` | public | public (unchanged) |
| `POST /api/jobs` | public | **requires Bearer token** |
| `PATCH /api/jobs/:id` | public | **requires Bearer token** |
| `DELETE /api/jobs/:id` | public | **requires Bearer token** |

## 5. Token Details

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Secret | `JWT_SECRET` env var (≥ 32 chars; dev value is a random hex string committed via `.env.example` as placeholder only) |
| Payload | `{ sub: <userId>, email: <email> }` |
| Expiry | `7d` |
| Header | `Authorization: Bearer <token>` |

### 5.1 `requireAuth` middleware behavior

1. Read `Authorization` header. If missing or not `Bearer <token>` → **401 `{ error: "Authentication required" }`**.
2. `jwt.verify(token, JWT_SECRET)` — on failure:
   - `TokenExpiredError` → **401 `{ error: "Token expired" }`**
   - any other → **401 `{ error: "Invalid token" }`**
3. Attach `req.user = { id: payload.sub, email: payload.email }`. Call `next()`.

No DB round-trip on every request — the JWT signature already proves authenticity, and the 7-day expiry bounds how long a deleted user's token could remain valid (an edge case that won't occur during a reviewer's demo).

## 6. Frontend Integration

### 6.1 Auth context

`frontend/lib/auth.js` exports:
- `AuthProvider` — reads `gtna_token` / `gtna_user` from localStorage on mount. If token exists, fires `api.auth.me()` once to validate; on success keeps state, on 401 clears storage.
- `useAuth()` — returns `{ user, isLoading, login, logout, register }`.
  - `login({email,password})` → calls API, stores token+user, updates state.
  - `register({email,password})` → calls API, stores token+user, updates state.
  - `logout()` → clears storage, sets `user=null`.

State shape: `{ user: { id, email } | null, isLoading: boolean }`.

### 6.2 `lib/api.js` changes

- `request()` helper reads `localStorage.getItem('gtna_token')` and attaches `Authorization: Bearer <token>` if present.
- On a 401 response: `localStorage.removeItem('gtna_token'); localStorage.removeItem('gtna_user'); window.dispatchEvent(new Event('gtna:auth-expired'))` then throw the error.
- New namespace `api.auth`:
  - `register({email,password})` → POST `/api/auth/register`
  - `login({email,password})` → POST `/api/auth/login`
  - `me()` → GET `/api/auth/me`

`AuthProvider` listens for `gtna:auth-expired` and forces a logout + redirect.

### 6.3 Login flow

1. User opens `/login` (or is redirected via `?next=/some/path`).
2. Submits email + password. Client-side validation: both non-empty.
3. `useAuth().login({email,password})` — on success, redirect to `next` or `/`; on 401, show "Invalid email or password" inline.

### 6.4 Register flow

1. User opens `/register`.
2. Submits email, password, confirm password. Client-side validation: email regex, password ≥ 8 chars, confirm matches.
3. `useAuth().register({email,password})` — on success, auto-redirect to `/` (already logged in); on 400/409, show inline error.

### 6.5 TopBar states

**Anonymous**
```
[Logo]  [search box]  ...  [Log in]  [Post a job →]
```
"Post a job" still appears but links to `/login?next=/jobs/new` instead of `/jobs/new`.

**Authenticated**
```
[Logo]  [search box]  ...  yohan@example.com  [Log out]  [Post a job]
```

### 6.6 Job detail page (`/jobs/[id]`)

| User state | Status dropdown | Delete button |
|---|---|---|
| Anon | hidden | hidden |
| Authed | visible | visible |

Below the read-only fields, anon users see: *"Log in to update or delete this job."* with a link to `/login?next=/jobs/<id>`.

### 6.7 New job page (`/jobs/new`)

Anon users are redirected client-side (`useEffect` after mount, since this is App Router with `'use client'`) to `/login?next=/jobs/new`. A brief "Redirecting…" message renders during the redirect.

## 7. Error Handling Matrix

| Scenario | Backend | Frontend behavior |
|---|---|---|
| Login wrong creds | 401 | Inline error on form |
| Register duplicate email | 409 | Inline error on form |
| Register weak password | 400 | Inline error on form |
| Protected route without token | 401 | API client clears storage, AuthProvider redirects to `/login` |
| Token expired mid-session | 401 | Same as above |
| Token signature invalid (e.g. secret rotated) | 401 | Same as above |
| `/api/auth/me` 401 on app load | 401 | AuthProvider silently clears storage (no redirect — user is just browsing) |

## 8. Out of Scope

The following are deliberately **not** implemented (assessment-sized scope):

- Password reset / forgot-password flow
- Email verification
- OAuth / social login
- Refresh tokens (single long-lived 7-day token is fine)
- Rate limiting on `/auth/*` endpoints
- Role-based access (no homeowner-vs-tradesperson distinction yet)
- Jest/Vitest unit tests on the auth endpoints (separate bonus; user said bonuses including tests are deferred — JWT is the only bonus being pulled in)
- Account lockout / brute-force protection

## 9. Risks & Notes

- **localStorage XSS risk.** Mitigation: the app has no `dangerouslySetInnerHTML` and no third-party rich-text rendering. Risk surface is small. Documented in README under "security notes" so reviewers see it was a conscious tradeoff.
- **`JWT_SECRET` rotation invalidates all tokens.** Acceptable for a demo; users just re-login.
- **No CSRF protection needed.** Because we use a header-based bearer token (not a cookie), CSRF doesn't apply.
- **CORS already allows the frontend origin** via `CORS_ORIGIN=http://localhost:3000`. No change.

## 10. README updates required

After implementation:
- Add `JWT_SECRET` to the env-vars table in README.
- Document the new endpoints in the API table.
- Add a "Demo flow" section: register → post a job → log out → confirm the homepage still loads but mutate buttons are gated.
