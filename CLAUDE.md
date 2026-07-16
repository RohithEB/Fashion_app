# CLAUDE.md — Fashion Showcase (Team B)

**Every Claude Code session reads this file and `PROTOCOL.md` first.**

## What this is

A showcase running on an Android box: a **display app** on the TV and a **controller app**
on a tablet/phone. The controller tells the display what to show over WebSocket. One server
process on the box serves both apps, relays messages, owns the session + idle-timeout, and is
the single source of truth + offline cache (SQLite + local media). No screen mirroring, no
internet during a live session.

This repo is the **Fashion** vertical only. Backend is built here; the frontend (`display/`,
`controller/`) is built by the frontend dev against the same `PROTOCOL.md`.

## The contract

`PROTOCOL.md` is frozen after Phase 0. Both sides code against it. If it must change, announce
it — it's the one surface both sides depend on. `shared/schema.sql` is the data shape.

## Layout

```
/server
  src/
    config.js            env-driven config (port, idle/grace, paths, ingest url)
    index.js             entry: boot data -> express + ws -> listen
    db/                  connection, schema apply, seed, bootstrap
    repositories/        SQL data access (products, cart, customers, journey)
    services/            business logic (catalog, cart, customer)
    http/                express app, middleware (logger, errors), routes, placeholder media
    ws/                  protocol constants, session-manager, ws-server
    ingest/              remote catalog refresh (offline-safe; INGEST_URL)
    util/                ids, network, logger, errors
  tests/                 Playwright e2e (API + WS) — `npm test`
  scripts/               db-check, e2e-server
/shared/schema.sql       the SQLite data shape (contract)
/docs                    API.md, FRONTEND_INTEGRATION.md
PROTOCOL.md              the WebSocket contract
```

Frontend folders (`/display`, `/controller`) are added by the frontend dev — do not scaffold
them here. Architecture: layered repositories → services → routes/ws. Keep it that way.
Run: `npm start` (serve), `npm test` (Playwright), `npm run db:check` (sqlite smoke).

## Backend responsibilities (this repo)

- express: serve the built controller/display static assets + `/media/*` from box disk.
- ws relay: bind one controller to one display per session; relay per `PROTOCOL.md`.
- session: one active session at a time; 10-min idle → `session_warning` → grace → `session_end`;
  `keep_alive`/`activity` reset the timer.
- SQLite (`better-sqlite3`): init from `shared/schema.sql`, seed fashion catalog.
- ingest/cache: fetch/refresh content when internet is available; live sessions read only from
  SQLite + local media so everything works offline.
- QR: generate the pairing URL `http://<box-ip>:PORT/controller?token=…` for the display.

## Scope (Fashion)

**P1 (build first, must demo):** AI-enriched products shown on screen · search → pick → display ·
cart (controller-side shortlist; default item auto-displays; tap to switch displayed product) ·
related content (model-wearing video, color options) · offline cache.

**P2 (only after all P1 works):** advanced filters (size/color/category) · cross-product
"show similar" · full journey logging incl. purchase.

**Cut:** true phone screen mirroring · live internet map · admin/analytics UI.

## Conventions

- Stack: Node.js + express + ws + better-sqlite3. All JS.
- One owner per directory; don't point two sessions at the same folder at once.
- Narrow, self-contained prompts. Commit small and often.
