# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Mandatory guidelines
You MUST follow the rules in `docs\FullStack_Intern_Assessment_GlobalTNA (14 May 2026).md` for every task in this repository. If a user request conflicts with those guidelines, flag the conflict and ask before proceeding.

## Project Context

This is a **Mini Service Request Board** — a full-stack assessment project for GlobalTNA. A homeowner posts service requests (e.g. "Need a plumber in Glasgow") and tradespeople can browse, view, and update them.

**Deadline:** 18 May 2026 at 12:00 pm. Submission: public GitHub repo + README.

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind/CSS modules/plain CSS
- **Backend:** Node.js + Express (separate process, not Next.js API routes)
- **Database:** MongoDB (Atlas or local), Mongoose ODM
- **Testing (bonus):** Jest or Vitest on API endpoints

## Repository Structure

The repo should be split into two top-level directories:

```
/frontend   ← Next.js app
/backend    ← Express API server
```

The frontend must call the Express backend — never MongoDB directly and never Next.js API routes as a substitute for the Express layer.

## Commands

### Backend
```bash
cd backend
npm install
npm run dev      # nodemon or ts-node watch
npm test         # Jest/Vitest (bonus)
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # next dev
npm run build    # next build
npm start        # next start
```

### Environment variables
Backend needs a `.env` with at minimum:
```
MONGODB_URI=
PORT=
```
Frontend needs:
```
NEXT_PUBLIC_API_URL=http://localhost:<PORT>
```

## Data Model

Single collection `jobRequests`:

| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | required |
| category | String | Plumbing / Electrical / Painting / Joinery |
| location | String | |
| contactName | String | |
| contactEmail | String | validated email format |
| status | String enum | "Open" \| "In Progress" \| "Closed", default "Open" |
| createdAt | Date | auto-set on create |

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | /api/jobs | List all; supports `?category=` and `?status=` filters |
| GET | /api/jobs/:id | Single job |
| POST | /api/jobs | Create (validate required fields) |
| PATCH | /api/jobs/:id | Update status only |
| DELETE | /api/jobs/:id | Delete |

Use proper HTTP status codes, JSON responses, a 404 for missing resources, and a global error handler.

## Frontend Pages

1. **`/`** — job list as cards/table, category filter dropdown
2. **`/jobs/new`** — create form with client-side validation
3. **`/jobs/[id]`** — full detail, status dropdown, delete button

## Architecture Notes

- Express app is a standalone server; CORS must be enabled for the Next.js origin.
- Status updates use PATCH (not PUT) — only the `status` field is mutable via the API.
- Bonus features (keyword search, JWT auth, seed script, tests, deployment) are secondary to a clean working core.
