# Maison Ébani — Fashion Showroom (POC)

A premium **luxury fashion showroom** system for high-end boutiques. A sales
associate uses a **mobile app** to privately browse an AI-enriched catalogue and   
**present selected pieces on a large in-store display** that the customer watches.

> **This is not screen mirroring.** It is **event-based Live Presentation
> Synchronization** — the phone screen is never streamed. Lightweight WebSocket
> events describe interactions (show product, change colour, change size, swipe
> image, zoom, scroll, play video…) and the display reproduces them from its own
> cached catalogue. This keeps the link tiny, fast and reliable over plain WiFi.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Architecture overview](#2-architecture-overview)
3. [Runtime modes](#3-runtime-modes)
4. [Folder structure](#4-folder-structure)
5. [Tech stack](#5-tech-stack)
6. [User flow](#6-user-flow)
7. [Features](#7-features)
8. [APIs and backend integration](#8-apis-and-backend-integration)
9. [WebSocket protocol](#9-websocket-protocol)
10. [State management](#10-state-management)
11. [Data models](#11-data-models)
12. [Setup instructions](#12-setup-instructions)
13. [Build & run](#13-build--run)
14. [Configuration](#14-configuration)
15. [Known limitations](#15-known-limitations)
16. [Future roadmap](#16-future-roadmap)
17. [Further documentation](#17-further-documentation)

---

## 1. Project overview

**Purpose.** Replace the awkward "here, look at my phone" moment in luxury retail.
The associate keeps a private, information-rich workspace on their device while the
customer sees a large, editorial, distraction-free presentation of exactly the piece
being discussed — with no personal notes, prices-in-progress or UI chrome leaking
onto the customer screen.

The system is composed of **four independently runnable applications**:

| App | Role | Runs on | Default port |
|---|---|---|---|
| `frontend/mobile_app` | Salesperson **controller** (portrait) | Associate's phone/tablet | — |
| `frontend/display_app` | Customer **display / kiosk** (dark, full-bleed) | In-store Android box / TV | `8080` (LAN server) |
| `server` | Node backend: HTTP + WebSocket + SQLite | Box or laptop on the LAN | `3000` |
| `cms` | Next.js admin: catalogue, AI enrichment, analytics | Laptop / back-office | `4000` |

---

## 2. Architecture overview

```
 MOBILE (salesperson)                          DISPLAY (customer screen)
 ─ browse privately (no sync)                  ─ phase state machine (FSM)
 ─ "Show on Screen" ────┐                      ─ renders from its own catalogue
 ─ live controls ───────┤   WebSocket events   ─ applies each event:
   colour / size /      │   show_product,        show_product   → presenting
   image / zoom /       │   change_*, zoom,      change_colour  → new variant
   scroll / video       │   scroll, clear,       zoom / scroll  → transform
                        └─▶ payment_success ──▶  payment_success→ Thank-You

        ┌───────────────── one of two transports ─────────────────┐
        │  BOX MODE (default): display hosts the LAN WS server     │
        │  BACKEND MODE:       Node server relays controller→display│
        └──────────────────────────────────────────────────────────┘

 CMS (Next.js) ──reads/writes──▶ SQLite ◀──reads/writes── Node server
```

**Layering.**

- **Backend** is strictly layered: `repositories/` (SQL) → `services/` (business
  logic) → `http/routes/` + `ws/` (transport). Keep it that way.
- **Frontend** is feature-first: each `features/<name>/` owns its controller and
  screens; shared foundation lives in `core/` (theme, config, realtime, router),
  `models/`, `data/` (repositories) and `widgets/`.
- **Two independent Flutter apps by design** — no shared package. The common
  foundation (theme, models, realtime, widgets) is duplicated with relative imports
  and **kept in sync manually**. Files known to be shared: `models/money.dart`,
  `models/product.dart`, `models/ws_event.dart`, `models/presentation_state.dart`,
  `data/backend_dto.dart`, `widgets/network_photo.dart`, `widgets/price_tag.dart`.

---

## 3. Runtime modes

Both Flutter apps compile to a single binary that runs in either mode, selected by
`AppConfig` (`lib/core/config/app_config.dart`).

### Box-as-server / offline — **DEFAULT**

`--dart-define=BACKEND=false` (the default value)

- The **display box hosts the server**: `IoDisplayRealtime` binds an HTTP +
  WebSocket server on `:8080` and encodes its **own LAN IP + pairing token** in the QR.
- Both apps read a **bundled snapshot of the real catalogue**
  (`assets/catalog_snapshot.json`, 37 products exported from the backend) via
  `BundledCatalogRepository`.
- **Images render on-device**: the backend's `/media/ph` SVG placeholders are
  reproduced natively by `NetworkPhoto` (gradient + frame + two-line serif label),
  so ~97% of catalogue imagery needs **no network at all**.
- Recommendations and the AI talking-point are computed **on-device**.
- **Works with no internet** — phone and display only need to be on the same WiFi.
- Auth/checkout/customers use the `Mock*` repositories → **no persistence**.

### Backend mode

`--dart-define=BACKEND=true --dart-define=BACKEND_HOST=<lan-ip>`

- Catalogue, auth, customers, cart, checkout and journey logging go over HTTP to the
  Node server; realtime goes through the server's WS relay.
- **Data is persisted** to SQLite and is visible in the CMS.
- Requires the Node server reachable on the LAN.

> The mobile app also exposes an in-app **Server settings** sheet that persists a
> runtime override (SharedPreferences) — it **wins over the compile-time default**
> until changed or the app is reinstalled.

---

## 4. Folder structure

```
Fashion_app/
├─ frontend/
│  ├─ mobile_app/                  # Salesperson controller (Flutter, portrait)
│  │  ├─ assets/catalog_snapshot.json
│  │  └─ lib/
│  │     ├─ core/
│  │     │  ├─ config/             # AppConfig — mode, host, media/ws URL builders
│  │     │  ├─ realtime/           # RealtimeService + backend/LAN/mock transports
│  │     │  ├─ router/             # go_router + redirect guards
│  │     │  └─ theme/              # colours, typography, spacing, radius, motion
│  │     ├─ data/                  # repositories (mock | http | bundled) + DTOs
│  │     ├─ features/
│  │     │  ├─ auth/               # login, register, AuthController
│  │     │  ├─ profile/            # SALESPERSON profile (setup + page)
│  │     │  ├─ connection/         # QR pairing, session, idle watcher
│  │     │  ├─ onboarding/         # CUSTOMER details capture
│  │     │  ├─ customer/           # CUSTOMER profile page + shared form
│  │     │  ├─ catalog/            # home/explore, collapsing scroll, colour filter
│  │     │  ├─ product/            # detail, gallery, fullscreen zoom, sync controls
│  │     │  ├─ recommendations/    # top-6 curated picks
│  │     │  ├─ cart/               # "Saved outfits"
│  │     │  ├─ checkout/           # checkout + payment success
│  │     │  ├─ presentation/       # PresentationController, live preview, now-showing
│  │     │  └─ settings/           # server settings sheet
│  │     ├─ models/                # Product, Money, Cart, Customer, WsEvent, …
│  │     └─ widgets/               # NetworkPhoto, PriceTag, ProductCard, AppButton
│  └─ display_app/                 # Customer display (Flutter, dark, full-bleed)
│     ├─ assets/catalog_snapshot.json
│     └─ lib/
│        ├─ core/{config,realtime,theme}/
│        ├─ data/                  # catalog repositories + DTOs
│        ├─ features/display/      # DisplayController (FSM) + screens/
│        ├─ models/                # mirrors the mobile models
│        └─ widgets/
├─ server/                         # Node + Express + ws + better-sqlite3
│  ├─ src/
│  │  ├─ config.js                 # env-driven config
│  │  ├─ index.js                  # entry: boot data → express + ws → listen
│  │  ├─ db/                       # connection, schema apply, seed, bootstrap
│  │  ├─ repositories/             # products, cart, customers, orders, journey, salespeople
│  │  ├─ services/                 # catalog, cart, customer, auth, checkout
│  │  ├─ http/                     # app, middleware, routes/, placeholder media
│  │  ├─ ws/                       # protocol constants, session-manager, ws-server
│  │  ├─ ingest/                   # remote catalogue refresh (offline-safe)
│  │  └─ util/                     # ids, network, logger, errors, password
│  ├─ tests/                       # Playwright e2e (API + WS)
│  └─ scripts/                     # db-check, db-view, db-reset, e2e-server
├─ cms/                            # Next.js 15 + MUI admin
│  └─ src/app/{dashboard,products,salespeople,api}/
├─ shared/schema.sql               # the SQLite data shape (contract)
├─ media/                          # media served from box disk (samples)
├─ docs/                           # API.md, Architecture.md, FolderStructure.md, …
├─ PROTOCOL.md                     # frozen WebSocket contract
├─ REQUIREMENTS.md                 # full product + technical spec
├─ PROJECT_TODO.md                 # living backlog
└─ CLAUDE.md                       # read-first for AI coding sessions
```

---

## 5. Tech stack

**Frontend (both apps)** — Flutter 3.41 / Dart 3.11, Material 3
`provider` (state + DI) · `go_router` (mobile navigation + guards) ·
`google_fonts` (Cormorant Garamond + Inter) · `material_symbols_icons` ·
`web_socket_channel` · `http` · `flutter_svg` · `shared_preferences`
Mobile only: `mobile_scanner` (QR scan) · Display only: `qr_flutter`, `video_player`

**Backend** — Node.js 20+ · Express (HTTP) · `ws` (WebSocket) ·
`better-sqlite3` (source of truth + offline cache) · `qrcode` · Playwright (e2e)

**CMS** — Next.js 15 · React 19 · MUI 6 (+ X Data Grid & Charts) ·
`better-sqlite3` (reads the *same* SQLite file) · `@anthropic-ai/sdk` (AI
enrichment) · `@aws-sdk/client-s3` (Cloudflare R2 image uploads)

---

## 6. User flow

```
Login ─▶ [optional] Salesperson profile setup ─▶ Pair display (QR)
      ─▶ Customer details (optional, skippable) ─▶ Top-6 recommendations
      ─▶ Browse / search / filter ─▶ Product detail ─▶ "Show on Screen"
      ─▶ Live controls (colour · size · image · zoom · scroll · gallery · video)
      ─▶ Saved outfits ─▶ Checkout ─▶ Payment success ─▶ End session (fresh QR)
```

1. **Login** — associate signs in (`/auth/login`); the bearer token + salesperson
   are persisted locally.
2. **Salesperson profile setup** *(optional, once per associate)* — all fields
   optional with a prominent **Skip**; stored locally per salesperson id.
3. **Pair a display** — the display shows a QR containing its IP + token; the
   associate scans it and the session is bound (one controller ↔ one display).
4. **Customer details** *(optional, prominent Skip)* — the guest's profile for
   **this session**: repeating-customer flag, name, mobile, DOB, gender, age range,
   style personality, occupation, fashion style, favourite colours, fit, size,
   occasion, budget, preferred brands, what they're wearing, notes.
5. **Recommendations** — top-6 curated picks scored from the captured profile.
   Skipping leaves behaviour exactly as before.
6. **Browse & present** — private browsing; "Show on Screen" pushes a product; every
   subsequent interaction is mirrored live.
7. **Saved outfits → Checkout → Payment success.**
8. **End session** — returns the display to a **fresh pairing QR** for the next guest.
   Saving the salesperson profile is independent of ending the session.

**Display phase machine:** `splash → advertisement → waiting (QR) → connecting →
loading → welcome → presenting | catalogue | cart | checkout → thankYou →
(countdown) → waiting`. Idle handling: `session_warning` → grace → `session_end`.

---

## 7. Features

**Presentation & sync** — show product · colour (variant) · size · image swipe ·
fullscreen pinch-zoom mirrored to the display · pan · detail-scroll mirroring ·
gallery grid · product video · "reset view" · clear/hide.

**Catalogue** — search, category chips, colour explorer, collapsing (Flipkart-style)
header, pull-to-refresh, product detail with variants/media/enrichment.

**Personalisation** — session-scoped customer profile, top-6 recommendations scored
on gender + personality + style hints, and a **private on-phone AI talking point**
("Say this…") that never appears on the customer display.

**Commerce** — Saved outfits (shortlist that doubles as the on-screen selector),
checkout with pre-filled guest details, order confirmation, journey logging.

**Admin (CMS)** — product CRUD with images, AI enrichment via Claude, R2 uploads,
salespeople, dashboard analytics.

---

## 8. APIs and backend integration

Base URL `http://<host>:3000/api`. Auth is a bearer token from login/register.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` · `/auth/login` · `/auth/logout` | Salesperson auth |
| GET | `/auth/me` | Current salesperson |
| GET | `/products` | List/search/filter/sort/page |
| GET | `/products/:id` | Full detail (variants + media + enrichment) |
| GET | `/products/:id/similar` | Cross-product "show similar" |
| GET | `/categories` · `/filters` | Facets (categories, colours, sizes, price range) |
| GET | `/recommendations` | Profile-matched picks (`gender`, `ageRange`, `personality`, `customerId`, `limit`) |
| GET | `/talking-point` | Private coaching cue for the associate |
| GET | `/customers/options` | Onboarding choice lists |
| POST | `/customers` · GET `/customers/:id` | Capture / fetch a guest |
| GET/POST/PATCH/DELETE | `/cart/:sessionId[...]` | Server-side cart |
| PUT | `/cart/:sessionId/default` | Item auto-shown on the display |
| POST | `/cart/:sessionId/checkout` | Place an order (auth) |
| GET | `/orders/:id` | Order detail (auth) |
| POST | `/journey` · GET `/journey` | Journey events |
| GET | `/health` | Health probe |
| GET | `/media/ph?w&h&bg&fg&text` | Generated SVG placeholder imagery |

**Integration seam.** The UI depends only on interfaces in `lib/data/`
(`CatalogRepository`, `AuthRepository`, `CustomerRepository`, `CheckoutRepository`).
Three implementations exist — `Mock*`, `Http*` and `BundledCatalogRepository` — and
are chosen in `app.dart` by `AppConfig.backendMode`. Adding an endpoint never
requires touching a screen.

---

## 9. WebSocket protocol

`PROTOCOL.md` is **frozen** — both sides build against it. Envelope:

```jsonc
{ "type": "show_product", "sessionId": "sess_…", "payload": { … } }
```

- **Controller → server:** `pair`, `activity`, `keep_alive`, and the relayed command
  set `show_catalog`, `show_cart`, `show_product`, `show_details`, `show_related`,
  `show_media`, `zoom`, `clear` (allow-listed by `RELAY_TYPES`).
- **Server → clients:** `display_registered` (pairing token + QR), `paired`,
  `session_warning`, `session_end`, `error`.
- **Session rules:** one active session per display; idle → warning → grace →
  `session_end`; ending a session frees the display and **re-issues a fresh QR**.
- In **box mode** the display hosts the socket directly and both sides speak the
  richer `WsEvent` vocabulary without the relay translation.

---

## 10. State management

`provider` + `ChangeNotifier`, one controller per feature, injected via
`MultiProvider` in `app.dart`.

| Controller | Owns |
|---|---|
| `AuthController` | Salesperson, bearer token, persisted session |
| `ProfileController` | Salesperson profile (local, per-associate) |
| `ConnectionController` | Pairing, `SessionInfo`, live-link status, idle warnings |
| `OnboardingController` | **Customer profile for the current session** + options |
| `CatalogController` | Products, categories, search/filter, silent refresh |
| `PresentationController` | The synchronized `ProductPresentation`; emits `WsEvent`s |
| `CartController` | Saved outfits + totals |
| `DisplayController` (display app) | Phase FSM, presented product, timers |

**Navigation.** `go_router` with a single `redirect` guard enforcing
`login → [profile setup] → connect → customer details → home`, refreshed by a
`Listenable.merge` of the auth/connection/onboarding/profile controllers.

**Synchronized state.** `ProductPresentation.applyEvent(WsEvent)` is a **pure
reducer** run identically on both apps — the mobile mirrors what the display shows.

---

## 11. Data models

`Product` / `ProductVariant` / `ProductMedia` / `ProductDetail` · `Money` (minor
units, Indian numbering for INR) · `Cart` / `CartItem` · `Customer` (session guest
profile) · `Salesperson` + `SalespersonProfile` · `SessionInfo` / `PairingInfo` ·
`Order` · `WsEvent` + `WsEventType` · `ProductPresentation` / `DisplayPhase`.

SQLite tables (`shared/schema.sql`): `products`, `variants`, `product_media`,
`product_enrichment`, `customers`, `carts`, `cart_items`, `salespeople`,
`auth_tokens`, `orders`, `order_items`, `journey_events`.

---

## 12. Setup instructions

**Prerequisites** — Flutter 3.41+, Node.js 20+ (24 recommended), a device/emulator,
and both devices on the **same WiFi** for a live session.

```bash
# 1) Backend
cd server && npm install

# 2) CMS
cd ../cms && npm install
cp .env.example .env.local   # if present; set DB_PATH, R2_*, ANTHROPIC_API_KEY

# 3) Flutter apps
cd ../frontend/mobile_app  && flutter pub get
cd ../display_app          && flutter pub get
```

---

## 13. Build & run

### Backend & CMS

```bash
cd server && npm start        # :3000 — seeds the catalogue on first run
npm test                      # Playwright e2e (API + WS)
npm run db:check              # SQLite smoke test

cd cms && npm run dev         # :4000
```

### Flutter apps

```bash
# Box-as-server / offline (DEFAULT) — no backend required
cd frontend/display_app && flutter run     # start the display FIRST (it hosts the server)
cd frontend/mobile_app  && flutter run     # scan the QR shown on the display

# Backend mode
flutter run --dart-define=BACKEND=true --dart-define=BACKEND_HOST=192.168.1.5
```

Release builds: `flutter build apk --release [--dart-define=…]`.

### Refreshing the offline catalogue snapshot

After editing products in the CMS, re-export the bundle both apps ship with:

```bash
# with the backend running on :3000
node scripts/export-catalog.mjs      # writes assets/catalog_snapshot.json in both apps
```

---

## 14. Configuration

| Define / env | Default | Applies to | Purpose |
|---|---|---|---|
| `BACKEND` | `false` | Both Flutter apps | `true` = Node backend, `false` = box-as-server |
| `BACKEND_HOST` | `10.0.1.12` | Both Flutter apps | Server LAN IP (backend mode) |
| `BACKEND_PORT` | `3000` | Both Flutter apps | Server port |
| `PORT` | `3000` | server | HTTP + WS port |
| `INGEST_URL` | *unset* | server | Remote catalogue refresh source |
| `DB_PATH` | — | server, cms | Shared SQLite file |
| `ANTHROPIC_API_KEY`, `AI_MODEL` | — | cms | AI enrichment |
| `R2_*` | — | cms | Cloudflare R2 image uploads |

Android manifests enable `INTERNET`/`CAMERA`, `usesCleartextTraffic` (for `ws://`
LAN traffic) and **disable Impeller** (required for `video_player` + `flutter_svg`
on the target boxes).

---

## 15. Known limitations

- **Box mode has no persistence.** Auth, checkout and customer capture use `Mock*`
  repositories — orders and guests are **not saved** and never reach the CMS. Use
  backend mode when data must persist.
- **The Node server does not run on the Android box.** Backend mode requires the
  server on a laptop/host on the LAN; Node + `better-sqlite3` need Termux (fragile)
  or a Dart re-implementation to truly live on the box.
- **Salesperson profile is local-only** (SharedPreferences, per device) — no API.
- **Customer styling fields are session-scoped.** Name, mobile, gender, age range,
  personality, occasion and the "wearing" notes persist via `/customers`; DOB,
  occupation, fashion style, colours, fit, size, budget, brands, notes and the
  repeat flag have **no backend column yet** and are modelled for a future API.
- **No profile photo picker** (`image_picker` not a dependency) — the model has
  `photoPath` and the UI falls back to an initials avatar.
- **Missing user fields**: no email, avatar, role/permissions, last-login or
  member-since exposed by the auth API.
- **Cloud images need internet.** ~17 catalogue images are Cloudflare R2 URLs; the
  other ~593 are on-device placeholders and work fully offline.
- **`ingest/` is scaffolded but unwired** — needs `INGEST_URL` and a source feed.
- **Two Flutter apps duplicate shared files** — they must be synced by hand.
- **No update endpoint for customers** (`POST` only), so profile edits stay local.
- **PROTOCOL.md is frozen** — changes must be announced to both sides.

---

## 16. Future roadmap

**Near term**
- Persistence for box mode (on-device SQLite via `drift`/`sqflite`) so orders and
  guests survive an offline session, syncing to the backend when online.
- Backend columns + `PATCH /customers/:id` for the full guest profile.
- Salesperson profile API (`PATCH /auth/me`) incl. email, avatar upload, role.
- Bundle the remaining R2 images for a 100% offline catalogue.

**Medium term**
- Run the server on the box itself (Node in Termux with `node:sqlite`, or a Dart
  HTTP/WS + SQLite server inside the display app).
- Wire `ingest/` for scheduled catalogue refresh.
- Extract the duplicated Flutter foundation into a shared package.
- Real AI talking points via the Anthropic SDK with an offline template fallback.

**Longer term**
- Analytics: per-associate journey replay and conversion reporting in the CMS.
- Multi-display / multi-session support per store.
- Role-based access control and audit trails.
- Automated widget/integration test coverage for both Flutter apps.

---

## 17. Further documentation

| Document | Contents |
|---|---|
| [`PROTOCOL.md`](PROTOCOL.md) | The frozen WebSocket contract |
| [`docs/API.md`](docs/API.md) | Full HTTP API reference |
| [`docs/Architecture.md`](docs/Architecture.md) | Deeper architecture notes |
| [`docs/FRONTEND_INTEGRATION.md`](docs/FRONTEND_INTEGRATION.md) | Wiring the apps to the backend |
| [`docs/FolderStructure.md`](docs/FolderStructure.md) | Directory-by-directory guide |
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Product + technical specification |
| [`PROJECT_TODO.md`](PROJECT_TODO.md) | Living backlog |
| [`RUN.md`](RUN.md) | Run/deploy cheatsheet |
| [`CLAUDE.md`](CLAUDE.md) | Conventions for AI coding sessions |
