# RunTheMic

Mobile-first karaoke night hosting: create an event, generate a flyer + QR code, collect RSVPs, and let guests
build a real YouTube playlist together — then run the night live from your phone.

This is the MVP build. See `.claude/plans` (or ask Claude) for the full milestone plan. Deferred to later
phases: song voting/democracy mode, AI recommendations, analytics dashboards, public event discovery, and
live Stripe ticket checkout (the schema and a stub route exist, but no real payment flow).

## Stack

Next.js (App Router) + TypeScript, a custom Node server (`server.ts`) running Next alongside Socket.IO for
realtime, PostgreSQL via Prisma, Auth.js (NextAuth v5) for organizer accounts, a separate lightweight guest
session (JWT cookie) for RSVP/song requests with no account required, Tailwind + hand-rolled Radix-based UI
components, Konva for the flyer canvas, and the YouTube Data API v3 via `googleapis`.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Postgres.** Any Postgres 14+ works locally (Docker, a local install, or a free Railway/Neon/Supabase
   instance). Point `DATABASE_URL` at it.

3. **Create your `.env`** (copy `.env.example`). Only these are required for the app to boot:

   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` locally
   - `ENCRYPTION_KEY` — `openssl rand -base64 32` (encrypts stored YouTube refresh tokens)

   Everything else (Google/Apple login, YouTube integration, Stripe, email) is optional — the app degrades
   gracefully (hidden buttons, "not connected" states) when those env vars are blank.

4. **Run migrations and seed demo data**

   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

   This creates a demo organizer (`demo@runthemic.test` / `password123`) with a published event
   (`/e/friday-night-karaoke-demo`), a mix of RSVPs (including one waitlisted guest), and queue items in every
   status.

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   This runs the custom server (`server.ts`) via `tsx watch`, which boots both Next.js and Socket.IO on
   `http://localhost:3000`.

## Enabling optional integrations

- **Google / Apple login** — set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and/or the `APPLE_*` vars. Social
  login buttons only render once their provider is configured.
- **YouTube playlist sync** — requires a Google Cloud project with the YouTube Data API v3 enabled and an OAuth
  client (same `GOOGLE_CLIENT_ID`/`SECRET` as login, since it's the same Google app — but the login flow only
  ever requests basic profile scope; YouTube's playlist-management scope is requested separately when an
  organizer clicks "Connect YouTube" in Settings). Without it, the song queue still works — it just stays
  DB-only instead of syncing to a real YouTube playlist.
- **Stripe** — `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are scaffolded (schema fields + a stub
  `POST /api/events/[id]/checkout` that returns "not configured") but no live checkout is implemented yet.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Custom server (Next + Socket.IO) with hot reload |
| `npm run build` / `npm start` | Production build / run |
| `npm run typecheck` | `tsc --noEmit` |
| `npx prisma studio` | Browse the database |
| `npx prisma migrate dev` | Apply schema changes |
| `npm run prisma:seed` | Re-seed demo data |

## Deploying

Built for Railway: it runs `server.ts` as a persistent Node process (not serverless), which is what lets
Socket.IO and Next.js share one HTTP server/port. Provision a Railway Postgres plugin, set the same env vars as
above (with real values for `NEXTAUTH_URL` and secrets), and set the start command to `npm run build && npm start`.
