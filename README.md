# GlobalTNA — Mini Service Request Board

A small full-stack app where homeowners post service requests and tradespeople
browse, view, and update them. Built to the
`docs/FullStack_Intern_Assessment_GlobalTNA (14 May 2026).md` brief.

The visual layer follows the **GlobalTNA design system** — the in-product board
is rendered as a tradesperson's clipboard of work-order tickets (trade-coded
spines, notched edges, mono job numbers), per the design handoff.

## Stack

- **Frontend:** Next.js 14 (App Router), plain CSS with design-token vars,
  `lucide-react` icons.
- **Backend:** Node + Express, Mongoose ODM, MongoDB.
- **Repo layout:**
  ```
  /backend   ← Express API
  /frontend  ← Next.js app
  /docs      ← assessment brief
  ```

## Environment variables

`backend/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/globaltna
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=<random hex string, >=32 chars>
```

Generate a `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Run it

1. **Mongo** — local Mongo on `:27017` or set `MONGODB_URI` to an Atlas string.
2. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env   # then edit if needed
   npm run seed           # optional — inserts ~8 sample jobs
   npm run dev            # http://localhost:4000
   ```
3. **Frontend** (separate terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev            # http://localhost:3000
   ```

## API

| Method | Path                    | Auth        | Notes                                              |
|--------|-------------------------|-------------|----------------------------------------------------|
| GET    | `/api/health`           | public      | Liveness check                                     |
| POST   | `/api/auth/register`    | public      | `{ email, password }` → `{ token, user }` (auto-login on 201) |
| POST   | `/api/auth/login`       | public      | `{ email, password }` → `{ token, user }`          |
| GET    | `/api/auth/me`          | **bearer**  | Validates a stored token; returns `{ user }`       |
| GET    | `/api/jobs`             | public      | List; supports `?category=`, `?status=`, `?q=`     |
| GET    | `/api/jobs/:id`         | public      | Single job (404 if missing or bad id)              |
| POST   | `/api/jobs`             | **bearer**  | Create; requires `title`, `description`, `category`|
| PATCH  | `/api/jobs/:id`         | **bearer**  | Update **status only**                             |
| DELETE | `/api/jobs/:id`         | **bearer**  | Delete; 204 on success                             |

`category` enum: `Plumbing | Electrical | Painting | Joinery`
`status` enum:   `Open | In Progress | Closed` (default `Open`)

Bearer-protected endpoints expect an `Authorization: Bearer <jwt>` header. JWTs
are HS256, signed with `JWT_SECRET`, expire after `7d`, and carry
`{ sub: userId, email }`. Reads remain fully public so anyone can browse the
board without an account.

## Frontend pages

- `/` — board view: job feed filtered by trade + status, work-order tickets.
- `/jobs/new` — post-a-job form with client-side validation (login-gated).
- `/jobs/[id]` — detail; status dropdown + delete shown only when signed in.
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

- Tokens are stored in `localStorage` (`gtna_token`, `gtna_user`). This is an
  XSS risk in apps that render untrusted HTML; this app does not use
  `dangerouslySetInnerHTML` or any third-party rich-text renderer, so the
  surface is small. Documented as a conscious tradeoff for assessment scope.
- Rotating `JWT_SECRET` invalidates every issued token — users just re-login.
- No CSRF protection needed: the bearer-header scheme is immune to cross-site
  cookie attacks. CORS is restricted to `CORS_ORIGIN`.
- Out of scope: password reset, email verification, OAuth, refresh tokens,
  rate limiting, role-based access, account lockout.

## Design system

Tokens live in `frontend/styles/tokens.css` and the board theme in
`frontend/styles/board.css`. Logos and the Unicons font live under
`frontend/public/`. The original handoff bundle is preserved at
`.design_unpack/globaltna-design-system/` for reference.
