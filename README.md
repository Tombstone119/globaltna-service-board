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

| Method | Path             | Notes                                              |
|--------|------------------|----------------------------------------------------|
| GET    | `/api/health`    | Liveness check                                     |
| GET    | `/api/jobs`      | List; supports `?category=`, `?status=`, `?q=`     |
| GET    | `/api/jobs/:id`  | Single job (404 if missing or bad id)              |
| POST   | `/api/jobs`      | Create; requires `title`, `description`, `category`|
| PATCH  | `/api/jobs/:id`  | Update **status only**                             |
| DELETE | `/api/jobs/:id`  | Delete; 204 on success                             |

`category` enum: `Plumbing | Electrical | Painting | Joinery`
`status` enum:   `Open | In Progress | Closed` (default `Open`)

## Frontend pages

- `/` — board view: job feed filtered by trade + status, work-order tickets.
- `/jobs/new` — post-a-job form with client-side validation.
- `/jobs/[id]` — detail, status update, delete.

## Design system

Tokens live in `frontend/styles/tokens.css` and the board theme in
`frontend/styles/board.css`. Logos and the Unicons font live under
`frontend/public/`. The original handoff bundle is preserved at
`.design_unpack/globaltna-design-system/` for reference.
