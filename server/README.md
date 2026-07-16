# Fashion Showcase — Server

Node backend for the Android-box fashion showcase: Express (HTTP data channel) + `ws`
(WebSocket command channel) + `better-sqlite3` (source of truth + offline cache).

## Run

```bash
npm install
npm start          # boots on :3000, seeds the catalog on first run
npm run dev        # watch mode
npm test           # Playwright e2e (API + WebSocket), starts its own server on :3100
npm run db:check   # sqlite native-addon smoke test
```

## Structure (layered)

```
src/
  db/            connection + schema + seed + bootstrap
  repositories/  SQL data access
  services/      business logic (catalog, cart, customer)
  http/          express app, middleware, routes, placeholder media
  ws/            protocol, session-manager, ws-server
  ingest/        remote catalog refresh (offline-safe)
  util/          ids, network, logger, errors
tests/           Playwright specs
```

See [`../docs/API.md`](../docs/API.md) for endpoints and [`../PROTOCOL.md`](../PROTOCOL.md)
for the WebSocket contract.

## Database

SQLite file (no server, no connection URL) created at `server/data/showcase.sqlite` on first
run. To browse in DBeaver: New Connection → **SQLite** → point "Path" at that file.

## Config (env)

`PORT` (3000) · `IDLE_MS` (600000) · `GRACE_MS` (60000) · `DB_PATH` · `MEDIA_DIR` ·
`INGEST_URL` (remote catalog to cache; unset = local seed only) · `LOG_LEVEL` (info).
