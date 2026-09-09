# SmartCRM

An AI-powered CRM built with Next.js 14 (App Router), TypeScript, Tailwind CSS,
Prisma/PostgreSQL, JWT auth, TanStack Query, Zustand, and OpenAI.

## Features

- **Auth**: signup + OTP email verification, login, forgot-password (email → OTP → new password),
  JWT access/refresh tokens in httpOnly cookies, route-protecting middleware.
- **Dashboard**: stat cards, lead-status pie chart, revenue trend line chart, recent activity feed.
- **Contacts**: full CRUD, search + status filter, CSV import/export, detail view with activity history.
- **Leads**: full CRUD, status filter, AI scoring, detail page with AI recommendations + email generator.
- **Pipeline**: drag-and-drop Kanban board across all lead statuses.
- **Tasks**: CRUD with priority, due date, status tabs, one-click status cycling.
- **AI**: lead scoring, email generator, sentiment analysis, next-action recommendations —
  all call OpenAI when `OPENAI_API_KEY` is set, and gracefully fall back to heuristic logic when it is not,
  so the app is fully demoable without any API key.
- **Profile**: edit name/photo, change password.

## Getting started

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT secrets, etc.
npx prisma migrate dev --name init
npm run seed                # optional demo data
npm run dev
```

Demo accounts after seeding (password `Password123!`):
- `admin@smartcrm.com`
- `agent@smartcrm.com`

## Environment variables

See `.env.example`. `OPENAI_API_KEY` and `SMTP_*` are optional — without them,
AI routes use built-in heuristics and outgoing emails are logged to the console
instead of sent, so you can run the whole app locally with just a database.

## Project structure

```
prisma/schema.prisma        Database schema (matches the provided spec)
src/app/(auth)/             Login, signup, forgot-password pages
src/app/(dashboard)/        Dashboard, contacts, leads, pipeline, tasks, profile
src/app/api/                REST API routes (auth, contacts, leads, tasks, ai, dashboard)
src/components/             Reusable UI + feature components
src/lib/                    Prisma client, JWT/auth helpers, mailer, validation schemas
src/store/                  Zustand stores (auth, UI)
src/middleware.ts           Route protection
```

## Notes / next steps for production

- Rate-limit auth endpoints (login, OTP requests) to prevent brute-forcing.
- Swap the base64 avatar upload for real object storage (S3/Cloudinary) if you need it to persist.
- Add role-based authorization checks (currently any authenticated user can read/write any record —
  add ownership/role checks in the API routes before going to production with multiple tenants).
- Add automated tests (the codebase is structured to make route + component tests straightforward).
