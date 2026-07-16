# Fashion Showcase — Backend (Team B)

Server for the Android-box fashion showcase. A **controller** (tablet) tells a **display** (TV)
what to show over WebSocket; this server relays messages, owns the session, and is the single
source of truth + offline cache.

> This repo currently holds the **backend + shared contract only**. The frontend dev clones it
> and builds `display/` and `controller/` against `PROTOCOL.md`.

## Read first

- [`CLAUDE.md`](CLAUDE.md) — orientation for any Claude Code session.
- [`PROTOCOL.md`](PROTOCOL.md) — the WebSocket contract. **Frozen after Phase 0.**
- [`shared/schema.sql`](shared/schema.sql) — the SQLite data shape.

## Layout

```
/server          Node backend (express + ws + better-sqlite3 + ingest/cache)  — not yet built
/shared          schema.sql and shared constants
PROTOCOL.md      the contract both sides code against
CLAUDE.md        read-first for Claude Code sessions
```

## Status

Monorepo skeleton + contract only. Server implementation not started.
