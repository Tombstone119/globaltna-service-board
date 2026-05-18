# GlobalTNA — Mini Service Request Board

A small full-stack app where a homeowner posts a service request (e.g. "Need a
plumber for a leaking kitchen tap in Glasgow") and tradespeople can browse open
requests, view details, and mark them as in progress or closed.

Built to the brief in
[`docs/FullStack_Intern_Assessment_GlobalTNA (14 May 2026).md`](docs/FullStack_Intern_Assessment_GlobalTNA%20(14%20May%202026).md).

## Tech stack

- **Frontend:** Next.js 14 (App Router), plain CSS with design-token vars,
  `lucide-react` icons.
- **Backend:** Node.js + Express (standalone process), Mongoose ODM.
- **Database:** MongoDB (local or Atlas free tier).
- **Tests:** Jest + Supertest + `mongodb-memory-server`.

## Repository layout

```
/backend    ← Express API (src/, tests/, seed script)
/frontend   ← Next.js app (App Router)
/docs       ← assessment brief
```

The frontend talks to the Express API only — never directly to MongoDB and
never via Next.js API routes.

## Features

**Core (per brief):**
- `jobRequests` collection with the specified schema and email-format validation.
- REST API: `GET/POST /api/jobs`, `GET/PATCH/DELETE /api/jobs/:id`, with
  `?category=` and `?status=` filters, proper HTTP status codes, a global error
  handler, and 404s for missing resources.
- Three Next.js pages: list with filter, create form with client-side
  validation, and detail page with status dropdown + delete.

**Bonus implemented:**
- Keyword search across title and description (`?q=`).
- JWT auth — registration, login, and gated write endpoints.
- Seed script (`npm run seed`) — ~8 sample jobs.
- Unit/integration tests on the API (Jest + Supertest, in-memory Mongo).

## Prerequisites

- Node.js ≥ 18
- npm
- MongoDB — either a local install on `:27017` or a MongoDB Atlas free-tier URI

## Environment variables

### `backend/.env`

```
MONGODB_URI=mongodb://127.0.0.1:27017/globaltna
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=<random hex string, >= 32 chars>
```

Generate a `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

A template lives at `backend/.env.example`.

### `frontend/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

A template lives at `frontend/.env.example`.

## Setup & run

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # then fill JWT_SECRET (and MONGODB_URI if remote)
npm run seed                  # optional — inserts ~8 sample jobs
npm run dev                   # http://localhost:4000
```

### 2. Frontend (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3000
```

Open `http://localhost:3000` — the board renders for anyone.

### 3. Tests (optional)

```bash
cd backend
npm test
```

Spins up an in-memory MongoDB; no local DB required.

## Data model — `jobRequests`

| Field          | Type   | Notes                                             |
|----------------|--------|---------------------------------------------------|
| `title`        | String | required                                          |
| `description`  | String | required                                          |
| `category`     | String | `Plumbing` / `Electrical` / `Painting` / `Joinery`|
| `location`     | String |                                                   |
| `contactName`  | String |                                                   |
| `contactEmail` | String | validated email format                            |
| `status`       | String | `Open` / `In Progress` / `Closed`, default `Open` |
| `createdAt`    | Date   | auto-set on create                                |

## API

| Method | Path                  | Auth        | Notes                                                       |
|--------|-----------------------|-------------|-------------------------------------------------------------|
| GET    | `/api/health`         | public      | Liveness check                                              |
| POST   | `/api/auth/register`  | public      | `{ email, password }` → `{ token, user }`                   |
| POST   | `/api/auth/login`     | public      | `{ email, password }` → `{ token, user }`                   |
| GET    | `/api/auth/me`        | **bearer**  | Validates a stored token; returns `{ user }`                |
| GET    | `/api/jobs`           | public      | List; supports `?category=`, `?status=`, `?q=` filters      |
| GET    | `/api/jobs/:id`       | public      | Single job (404 if missing or bad id)                       |
| POST   | `/api/jobs`           | **bearer**  | Create; validates `title`, `description`, `category`, email |
| PATCH  | `/api/jobs/:id`       | **bearer**  | Update **status only**                                      |
| DELETE | `/api/jobs/:id`       | **bearer**  | Delete; 204 on success                                      |

Bearer-protected endpoints expect `Authorization: Bearer <jwt>`. Reads stay
public so anyone can browse the board without an account.

## Frontend pages

- `/` — job list with category + status filters.
- `/jobs/new` — create form with client-side validation (login-gated).
- `/jobs/[id]` — detail page; status dropdown + delete shown when signed in.
- `/login`, `/register` — minimal auth forms. Register auto-signs you in.

## Demo flow

1. Open `http://localhost:3000` — the board renders for anyone.
2. Click **Post a job** — you'll be redirected to `/login?next=/jobs/new`.
3. Hit **Create account**, register with any email + password (≥ 8 chars).
4. You're signed in and dropped on the new-job form. Post a job.
5. Open the job detail page — the status dropdown and delete button are visible.
6. Click **Log out** in the top bar. Refresh: the board still loads, but the
   status dropdown, delete button, and **Post a job** flow are gated.

## Security notes

- JWTs are HS256, signed with `JWT_SECRET`, expire after `7d`, carry
  `{ sub: userId, email }`.
- Tokens are stored in `localStorage` (`gtna_token`, `gtna_user`). This is an
  XSS risk in apps that render untrusted HTML; this app does not use
  `dangerouslySetInnerHTML` or any third-party rich-text renderer, so the
  surface is small. A conscious tradeoff for assessment scope.
- Rotating `JWT_SECRET` invalidates every issued token — users just re-login.
- No CSRF protection needed: bearer-header auth is immune to cross-site cookie
  attacks. CORS is restricted to `CORS_ORIGIN`.
- Out of scope: password reset, email verification, OAuth, refresh tokens,
  rate limiting, role-based access, account lockout.

## Design system

Tokens live in `frontend/styles/tokens.css` and the board theme in
`frontend/styles/board.css`. Logos and the Unicons font are under
`frontend/public/`. The original handoff bundle is preserved at
`.design_unpack/globaltna-design-system/` for reference.
