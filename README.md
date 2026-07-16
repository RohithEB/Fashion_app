# Maison Ébani — Fashion Showroom (POC)

A premium **luxury fashion showroom** system for high-end boutiques. A sales
associate uses a **mobile app** to privately browse an AI-enriched catalogue and
**present selected pieces on a large in-store display** the customer watches.

> **This is not screen mirroring.** It is **event-based Live Presentation
> Synchronization** — the phone screen is never streamed. Lightweight WebSocket
> events describe interactions (show product, change colour, zoom, pan, play
> video…) and the display reproduces them from its own cached catalogue.

---

## Repository layout

```
Fashion_app/
├─ frontend/
│  ├─ mobile_app/     # Salesperson controller (Flutter, portrait)
│  └─ display_app/    # Customer display / TV (Flutter, landscape, dark)
├─ server/            # Backend: Node + Express (HTTP) + ws (WebSocket) + SQLite
├─ shared/            # schema.sql — the DB/data contract
├─ docs/              # Architecture, API reference, frontend-integration guide
├─ PROTOCOL.md        # The WebSocket contract (both sides build against this)
├─ CLAUDE.md          # Read-first for Claude Code sessions
├─ REQUIREMENTS.md    # Full product + technical spec
├─ PROJECT_TODO.md    # Hierarchical, living backlog
└─ README.md
```

Two independent Flutter apps (no shared packages by design) plus one Node backend.
Frontend shared foundation (theme, models, realtime, mock data, common widgets) is
authored with relative imports and kept in sync across both `lib/` trees.

## Tech stack

**Frontend**
- **Flutter 3.41 / Dart 3.11**, Material 3.
- **provider** — state management & DI (`ChangeNotifier` controllers).
- **go_router** — declarative navigation with auth/pairing guards (mobile).
- **google_fonts** — Cormorant Garamond (display serif) + Inter (UI).
- **material_symbols_icons** — rounded icon set.
- **mobile_scanner** (mobile, QR scan) · **qr_flutter** (display, QR render).
- **web_socket_channel** — realtime transport (behind an abstraction; a mock
  in-app loopback powers the POC, a real Android-hosted LAN server drops in later).

**Backend**
- **Node.js + Express** — HTTP data channel (catalog/search/cart/customers).
- **ws** — WebSocket command channel (pairing, show-on-TV, session lifecycle).
- **better-sqlite3** — source of truth + offline cache; seeded fashion catalogue.

## Architecture at a glance

```
 MOBILE (salesperson)                         DISPLAY (customer TV)
 ─ browse privately (no sync)                 ─ phase state machine (FSM)
 ─ "Show on Screen" ─┐                         ─ renders from cached catalogue
 ─ live controls ────┤  WebSocket events       ─ applies each event:
   (colour/zoom/pan/ │  showProduct,             showProduct → presenting
    video/AI notes)  │  changeColor, zoomImage,  changeColor/zoom/… → update
                     └─▶ ...  paymentSuccess ───▶ paymentSuccess → Thank-You
```

- **Design tokens** (`core/theme/`) — colours (semantic, light+dark), typography,
  spacing (8-pt), radius, elevation, motion, sizes — everything flows from tokens;
  no hardcoded values in features.
- **Models** (`models/`) — `Product`/`Variant`/`Media`, `Cart`, `Money`,
  `Session`/`PairingInfo`, the `WsEvent` protocol, and `ProductPresentation`
  (the synchronized state, reduced from events by a pure `applyEvent`).
- **Repositories** (`data/`) — `CatalogRepository` interface + `MockCatalogRepository`
  (seeded, AI-enriched); swap for the backend HTTP API later with no UI change.
- **Realtime** (`core/realtime/`) — `RealtimeService` interface, `MockRealtimeService`
  loopback for the POC.
- **Feature-first** `features/` folders, each with its controller + screens.

## Running

### Frontend (Flutter 3.41+)

```bash
# Salesperson app
cd frontend/mobile_app
flutter pub get
flutter run            # choose a device (Android / iOS / Chrome)

# Customer display app
cd frontend/display_app
flutter pub get
flutter run            # best on a tablet / TV in landscape
```

Both apps are verified to build for web (`flutter build web`).

### Backend (Node 20+)

```bash
cd server
npm install
npm start              # boots on :3000, seeds ~36 products on first run
npm test               # Playwright e2e (API + WebSocket)
```

See [`server/README.md`](server/README.md), the API reference in
[`docs/API.md`](docs/API.md), the WebSocket contract in [`PROTOCOL.md`](PROTOCOL.md),
and the integration guide in [`docs/FRONTEND_INTEGRATION.md`](docs/FRONTEND_INTEGRATION.md).

### Demo flow (frontend, no backend needed)
1. **Display app** boots → splash → advertisement loop → **waiting screen with QR**.
   *Tap the display anywhere* to run a hands-free scripted session (connect →
   welcome → product → colour change → AI notes → next product → thank-you).
2. **Mobile app** → pick an associate → **Connect to demo display** (or scan a QR)
   → browse the collection → open a product → **Show on Screen** → change colour /
   toggle atelier notes → open the **Cart** and tap **Present** on any item to
   switch the look live → **Checkout → Pay** → display shows **Thank You**.

## Real LAN connection

On a **native build** the display app hosts a WebSocket server on the WiFi LAN
(`dart:io`, port 8080) and encodes its real device IP + token in the pairing QR.
The salesperson app scans it and connects with `web_socket_channel`; from then on
every presentation interaction (show product, colour, **pinch-zoom / pan**, video,
AI notes, payment) flows as live-sync events. On **web** (which cannot host a TCP
server) both apps fall back to an in-app loopback + scripted demo, so everything
still runs. Selection is by conditional import — the web build never sees `dart:io`.

Android manifests enable `INTERNET` / `CAMERA` and `usesCleartextTraffic` for
`ws://` LAN traffic.

> **Note (frontend ↔ backend):** the POC currently hosts the WS server *inside* the
> display app. The Node `server/` provides the alternative production topology — one
> on-box server that owns pairing, session/idle, the catalogue and the cart over
> HTTP + `ws://<box-ip>:3000/ws`. Integration is via the interfaces in
> `data/` and `core/realtime/`; see `docs/FRONTEND_INTEGRATION.md`.

## Status

**Frontend**
- **Milestone 1** — both apps build clean; full premium UI flow on mock data with
  event-based live sync.
- **Milestone 2** — real LAN WebSocket server hosted in the display app; mobile WS
  client with graceful demo fallback; live pinch-zoom / pan gesture sync.

**Backend**
- HTTP APIs (catalog/search/filter/detail/similar, customers, server-side cart),
  WebSocket (QR pairing, show_product/related/zoom/clear relay, idle→warning→end
  lifecycle), SQLite seed of ~36 products across men/women/unisex. Playwright e2e
  green. See `PROJECT_TODO.md` and `REQUIREMENTS.md` for the full spec.
