# Hosting on Vercel

Deferred: the demo runs locally, and the owner does not want a hosted database for it right now. This is the plan for when that changes. Vercel's Hobby plan and Turso's free tier would cover a demo of this size; the work is in the code changes below, not the bill.

## What does not survive a serverless host

- The SQLite file. `node:sqlite` writes `data/testdrive.db` on local disk. On Vercel the filesystem is read-only apart from `/tmp`, and `/tmp` is per instance and wiped, so bookings would vanish and each instance would see its own data.
- The in-process event bus. `src/lib/events.ts` is a module-level emitter. Fluid Compute reuses instances, but there can be several, so a booking made on one instance would not reach an SSE connection held by another.
- Migrations on startup. `createDb` runs migrations when the process opens the database. On a hosted database that should happen once, in the build or a release step, not on every cold start.

## Smallest change that works

1. Database: Turso (libSQL) from the Vercel Marketplace. It is SQLite on the wire, so `src/db/schema.ts` and the migrations in `drizzle/` stay as they are. Swap the driver in `src/db/index.ts` from `drizzle-orm/node-sqlite` to `drizzle-orm/libsql` when `TURSO_DATABASE_URL` is set, keep `node:sqlite` for local and tests. The service uses `db.$client.exec` for `BEGIN IMMEDIATE`; on libSQL use `db.transaction` instead. Run `drizzle-kit migrate` as the Vercel build command before `next build`.
2. Realtime: replace the module emitter with a `domain_events` table. `emit` inserts a row; the SSE route polls every two seconds for rows newer than the last id it sent. No extra service, works locally too, two seconds is fine for a demo. Upstash Redis pub/sub is the upgrade if the delay matters.
3. Keep the SSE route on the Node runtime (it already is). Streaming works on Vercel Functions without configuration.
4. The MCP endpoint has no auth. Anyone with the URL can book and cancel. For a public demo add a shared bearer token checked in `src/app/api/mcp/route.ts` and pass it in the Claude Code and Claude Desktop snippets on the Connect page.
5. WebMCP needs a secure origin, which Vercel provides. The `Origin-Agent-Cluster` header must not be set to `?0`; Vercel does not set it.

## Steps when we get there

```bash
npm i -g vercel
vercel link
vercel integration add turso        # or through the dashboard
vercel env pull
```

Then the driver swap, the events table, a build command of `pnpm drizzle-kit migrate && pnpm build`, and a seed run against the hosted database (`DB` pointed at Turso, `pnpm db:seed`).
