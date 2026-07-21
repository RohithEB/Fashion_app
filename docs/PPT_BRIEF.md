# Fashion Showroom — Project Summary & PPT Brief

**One self-contained file.** Part A is a prompt you can paste into any deck-generating
tool (Claude, ChatGPT, Gamma, Copilot in PowerPoint, Google Slides AI). Part B is the
complete source material that prompt refers to — everything about the project, in one
place, with nothing external required.

> If you paste this into a tool, **paste the whole file**. Part A alone is not enough.

---

# PART A — THE PROMPT

> Copy from here to the "END OF PROMPT" marker.

You are a senior presentation designer. Build a **16-slide, 16:9 presentation** about the
project described in **Part B** of this document. Read Part B fully before writing a
single slide.

**Audience.** A mixed room: the client's business stakeholders (luxury retail) and their
technical reviewers. Slides 1–7 must land for a non-technical reader; slides 8–13 are for
the engineers; 14–16 close for everyone.

**Voice.** Confident, plain, unhyped. No "revolutionary", "seamless", "cutting-edge",
"game-changing". Short declarative sentences. Concrete nouns over adjectives. The product
is expensive and quiet — the deck should sound the same.

**Visual direction — editorial luxury, not a SaaS pitch.**
- Dark background `#0E0E10`; panels `#1A1A1E`; hairlines `#333338`.
- Primary text ivory `#F5F2EC`; secondary/muted `#9A9790`; single accent champagne `#C6A664`.
- Champagne is used **only** for kickers, headings' underline rule, and key terms — never
  as a fill for large areas.
- Headlines in a serif (Cormorant Garamond, or Georgia as fallback). Body in a neutral
  sans (Inter, or Segoe UI). Code and diagrams in a monospace (Consolas).
- Every content slide: a small uppercase champagne kicker, a serif headline, a short
  champagne rule beneath it, then the body. Footer left "Maison Ébani · <kicker>", page
  number right.
- Generous whitespace. Max ~6 bullets a slide, max ~2 lines a bullet. Never fill the slide
  just because there is room.

**Slide plan — follow this order and these titles.**

| # | Kind | Title | Content to use from Part B |
|---|---|---|---|
| 1 | Title | Maison Ébani | Subtitle: "Fashion Showroom — a guided luxury selling experience". Blurb: not screen mirroring; event-based Live Presentation Synchronization. Footer meta: the four apps and their stacks. |
| 2 | Bullets | "Here, look at my phone." | §1 The problem |
| 3 | Bullets | One product, two screens, zero leakage | §2 The solution |
| 4 | Diagram | How the pieces fit | §3 Architecture — reproduce the ASCII diagram verbatim in a monospace panel |
| 5 | 4 columns | Four independently runnable apps | §4 The applications |
| 6 | Diagram | The session, end to end | §5 User flow — the flow block in monospace, display phase machine as the note |
| 7 | Bullets | Live Presentation Synchronization | §6 — the differentiator |
| 8 | Table | The frozen WebSocket contract | §7 |
| 9 | Table | HTTP API surface | §8 |
| 10 | 4 columns | What is built | §9 Feature set |
| 11 | Table | Technology choices | §10 |
| 12 | 2 columns | Two runtime modes, one binary | §11 |
| 13 | Diagram | From clone to live demo | §12 — the shell block in monospace |
| 14 | Bullets | Known limitations | §13 — keep these; they build credibility, do not soften them |
| 15 | 3 columns | Where it goes next | §14 Roadmap |
| 16 | Section | The guest sees the piece. Never the phone. | Sub-line: "Private cockpit · editorial stage · event sync · offline by default." |

**Rules.**
- Bullets on slides 2, 3, 7, 14 use a **bold champagne lead phrase**, then the explanation
  in ivory on the same line.
- Reproduce the ASCII diagrams and the shell block **exactly** — do not redraw them as
  shapes or prettify them.
- Tables: champagne bold header row on the dark background, alternating row fills, first
  column ivory, remaining columns muted.
- Do not invent features, metrics, customers, timelines or pricing. If a number is not in
  Part B, it does not go in the deck.
- Slide 14 is not optional. Present the limitations as stated.

**Deliverable.** A `.pptx` file. If you can run code, generate it with `python-pptx`.

**END OF PROMPT**

---

# PART B — PROJECT SOURCE MATERIAL

## §0. What this is, in three sentences

Maison Ébani Fashion Showroom is a proof-of-concept selling system for high-end boutiques.
A sales associate uses a phone to privately browse an AI-enriched catalogue and push
selected pieces to a large in-store display the customer watches. It is a guided,
concierge-style experience — not an e-commerce app, and explicitly **not screen mirroring**.

## §1. The problem

- **The moment breaks the sale.** A five-inch screen, held sideways, with the associate's
  private notes, prices-in-progress and UI chrome all visible to the guest.
- **Mirroring is worse.** Streaming the phone shows every search, every mis-tap, every
  hesitation — and needs bandwidth a boutique WiFi rarely has.
- **Luxury retail needs two views.** A private, information-rich cockpit for the associate;
  a large, editorial, distraction-free stage for the customer.
- **And it must work offline.** In-store WiFi drops. The experience cannot.

## §2. The solution

- **Private by default.** The associate browses, searches and filters freely. None of it
  reaches the display.
- **Presentation on demand.** "Show on Screen" starts the synchronized presentation — and
  only then.
- **Events, not video.** Tiny WebSocket messages (`show_product`, `change_colour`, `zoom`,
  `scroll`) describe the interaction; the display renders it from its own cached catalogue.
- **Offline-first.** Both apps ship a 37-product catalogue snapshot and draw ~97% of
  imagery on-device. Phone and display just need the same WiFi.
- **Production-shaped.** Layered backend, repository seams, a frozen protocol and e2e
  tests — a POC that scales into a product.

## §3. Architecture

```
 MOBILE (salesperson)                          DISPLAY (customer screen)
 - browse privately (no sync)                  - phase state machine (FSM)
 - "Show on Screen" ----+                      - renders from its own catalogue
 - live controls -------|   WebSocket events   - applies each event:
   colour / size /      |   show_product,        show_product   -> presenting
   image / zoom /       |   change_*, zoom,      change_colour  -> new variant
   scroll / video       |   scroll, clear,       zoom / scroll  -> transform
                        +-> payment_success -->  payment_success-> Thank-You

        +---------------- one of two transports -------------------+
        |  BOX MODE (default): display hosts the LAN WS server     |
        |  BACKEND MODE:       Node server relays controller->display|
        +----------------------------------------------------------+

 CMS (Next.js) --reads/writes--> SQLite <--reads/writes-- Node server
```

**Layering.** The backend is strictly layered: `repositories/` (SQL) → `services/`
(business logic) → `http/routes/` + `ws/` (transport). The frontend is feature-first: each
`features/<name>/` owns its controller and screens; shared foundation lives in `core/`
(theme, config, realtime, router), `models/`, `data/` and `widgets/`.

**Two independent Flutter apps by design** — no shared package. The common foundation is
duplicated with relative imports and kept in sync manually.

## §4. The applications

| App | Role | Runs on | Port |
|---|---|---|---|
| `frontend/mobile_app` | Salesperson **controller** (portrait) | Associate's phone/tablet | — |
| `frontend/display_app` | Customer **display / kiosk** (dark, full-bleed) | In-store Android box / TV | `8080` (LAN server) |
| `server` | Node backend: HTTP + WebSocket + SQLite | Box or laptop on the LAN | `3000` |
| `cms` | Next.js admin: catalogue, AI enrichment, analytics | Laptop / back-office | `4000` |

- **mobile_app** — login & salesperson profile · QR pairing · search, filter, colour
  explorer · product detail with live controls · saved outfits · checkout · private AI
  talking point.
- **display_app** — phase state machine · pairing QR + welcome · editorial product
  presentation · gallery, video, colourways · thank-you and idle return · hosts the LAN
  server in box mode.
- **server** — auth + bearer tokens · catalogue, search, filters · recommendations and
  talking points · cart, checkout, orders · WS relay + session rules · Playwright e2e.
- **cms** — product CRUD with images · AI enrichment via Claude · Cloudflare R2 uploads ·
  salespeople · dashboard analytics · reads the same SQLite file.

## §5. User flow

```
Login
  -> [optional] Salesperson profile setup
  -> Pair display (scan the QR on screen)
  -> Customer details (optional, skippable)
  -> Top-6 recommendations
  -> Browse / search / filter        (private — nothing on screen)
  -> Product detail -> "Show on Screen"   <-- presentation begins
  -> Live controls: colour · size · image · zoom · scroll · gallery · video
  -> Saved outfits -> Checkout -> Payment success
  -> End session -> display returns to a fresh pairing QR
```

Steps in detail:

1. **Login** — the associate signs in (`/auth/login`); bearer token + salesperson persisted locally.
2. **Salesperson profile setup** *(optional, once)* — all fields optional, prominent Skip.
3. **Pair a display** — the display shows a QR containing its IP + token; scanning binds
   one controller to one display.
4. **Customer details** *(optional, prominent Skip)* — the guest's profile for this
   session: repeat flag, name, mobile, DOB, gender, age range, style personality,
   occupation, fashion style, favourite colours, fit, size, occasion, budget, preferred
   brands, what they're wearing, notes.
5. **Recommendations** — top-6 curated picks scored from the captured profile. Skipping
   changes nothing else.
6. **Browse & present** — private browsing; "Show on Screen" pushes a product; every
   subsequent interaction is mirrored live.
7. **Saved outfits → Checkout → Payment success.**
8. **End session** — returns the display to a fresh pairing QR for the next guest.

**Display phase machine:** `splash → advertisement → waiting (QR) → connecting → loading →
welcome → presenting | catalogue | cart | checkout → thankYou → (countdown) → waiting`.
Idle handling: `session_warning` → grace → `session_end`.

## §6. Live Presentation Synchronization — the differentiator

- **The phone screen is never streamed.** A pinch-to-zoom emits
  `zoom { scale, focalX, focalY }`; the display applies the same transform to its own
  cached image.
- **Synchronized set.** Show / hide product · colour variant · size · image swipe ·
  pinch-zoom · pan · detail-scroll · gallery grid · video play/pause/seek · reset view.
- **A pure reducer on both sides.** `ProductPresentation.applyEvent(WsEvent)` runs
  identically on mobile and display — the mobile mirrors exactly what the guest sees.
- **Cheap on the wire.** Payloads are ids plus transform parameters; high-frequency
  gestures are throttled and coalesced before emission.
- **Always-visible truth.** The associate always has a "now showing" indicator — no
  guessing what the customer can see.

## §7. WebSocket protocol (`PROTOCOL.md` — frozen)

Envelope: `{ "type": "show_product", "sessionId": "sess_…", "payload": { … } }`

| Direction | Messages | Rule |
|---|---|---|
| Controller → server | `pair`, `activity`, `keep_alive` | Binds one controller to one display; resets the idle timer |
| Relayed commands | `show_catalog`, `show_cart`, `show_product`, `show_details`, `show_related`, `show_media`, `zoom`, `clear` | Allow-listed by `RELAY_TYPES` — anything else is rejected |
| Server → clients | `display_registered`, `paired`, `session_warning`, `session_end`, `error` | Server is authoritative; the display never trusts the mobile directly |
| Session lifecycle | 10-min idle → `session_warning` → grace → `session_end` | Ending frees the display and re-issues a fresh QR |
| Box mode | Richer `WsEvent` vocabulary, no relay translation | The display hosts the socket directly |

## §8. HTTP API surface

Base URL `http://<host>:3000/api`. Auth is a bearer token from login/register.

| Endpoint | Purpose |
|---|---|
| `/auth/register` · `/login` · `/logout` · `/me` | Salesperson auth, bearer token |
| `/products` · `/products/:id` · `/:id/similar` | List, search, filter, sort, page; full detail; cross-product "show similar" |
| `/categories` · `/filters` | Facets — categories, colours, sizes, price range |
| `/recommendations` · `/talking-point` | Profile-matched picks; private coaching cue for the associate |
| `/customers` · `/customers/options` | Capture the session guest; onboarding choice lists |
| `/cart/:sessionId` (+ `/default`, `/checkout`) | Server-side cart, auto-displayed item, order placement |
| `/orders/:id` · `/journey` · `/health` | Order detail, journey events, health probe |
| `/media/ph?w&h&bg&fg&text` | Generated SVG placeholder imagery — the offline image strategy |

**Integration seam.** The UI depends only on interfaces in `lib/data/`
(`CatalogRepository`, `AuthRepository`, `CustomerRepository`, `CheckoutRepository`).
Three implementations exist — `Mock*`, `Http*`, `BundledCatalogRepository` — chosen in
`app.dart` by `AppConfig.backendMode`. Adding an endpoint never requires touching a screen.

## §9. Feature set

- **Presentation & sync** — show product · colour (variant) · size · image swipe ·
  fullscreen pinch-zoom mirrored to the display · pan · detail-scroll mirroring · gallery
  grid · product video · reset view · clear/hide.
- **Catalogue** — search, category chips, colour explorer, collapsing header,
  pull-to-refresh, product detail with variants/media/enrichment.
- **Personalisation** — session-scoped customer profile, top-6 recommendations scored on
  gender + personality + style hints, and a **private on-phone AI talking point**
  ("Say this…") that never appears on the customer display.
- **Commerce** — saved outfits (a shortlist that doubles as the on-screen selector),
  checkout with pre-filled guest details, order confirmation, journey logging.
- **Admin (CMS)** — product CRUD with images, AI enrichment via Claude, R2 uploads,
  salespeople, dashboard analytics.

## §10. Technology choices

| Layer | Stack | Why |
|---|---|---|
| Both apps | Flutter 3.41 / Dart 3.11, Material 3 | One codebase for phone and Android box |
| State & nav | `provider` (ChangeNotifier) + `go_router` guards | One controller per feature, DI via `MultiProvider` |
| Look | Cormorant Garamond + Inter, Material Symbols Rounded | Editorial luxury, fully tokenised — no hardcoded values |
| Realtime | `web_socket_channel`; `ws` on the server | Events, not video |
| Backend | Node 20 · Express · `better-sqlite3` · `qrcode` | Single process, single file of truth |
| CMS | Next.js 15 · React 19 · MUI 6 · Anthropic SDK · AWS S3 SDK (R2) | Back-office editing and AI enrichment |
| Quality | Playwright e2e (API + WS), `npm run db:check` | The contract is tested, not assumed |

**State management.** `provider` + `ChangeNotifier`, one controller per feature, injected
via `MultiProvider`: `AuthController`, `ProfileController`, `ConnectionController`,
`OnboardingController`, `CatalogController`, `PresentationController`, `CartController`,
and `DisplayController` (display app, owns the phase FSM).

**Navigation.** `go_router` with a single `redirect` guard enforcing
`login → [profile setup] → connect → customer details → home`.

**Data models.** `Product` / `ProductVariant` / `ProductMedia` / `ProductDetail` · `Money`
(minor units, Indian numbering for INR) · `Cart` / `CartItem` · `Customer` · `Salesperson`
+ `SalespersonProfile` · `SessionInfo` / `PairingInfo` · `Order` · `WsEvent` +
`WsEventType` · `ProductPresentation` / `DisplayPhase`.

**SQLite tables** (`shared/schema.sql`): `products`, `variants`, `product_media`,
`product_enrichment`, `customers`, `carts`, `cart_items`, `salespeople`, `auth_tokens`,
`orders`, `order_items`, `journey_events`.

## §11. Two runtime modes, one binary

Selected by `AppConfig` (`lib/core/config/app_config.dart`).

**Box mode — DEFAULT** (`--dart-define=BACKEND=false`)
- The display box hosts the server: `IoDisplayRealtime` binds HTTP + WebSocket on `:8080`
  and encodes its own LAN IP + pairing token in the QR.
- Both apps read a bundled snapshot of the real catalogue
  (`assets/catalog_snapshot.json`, 37 products) via `BundledCatalogRepository`.
- Images render on-device: the backend's `/media/ph` SVG placeholders are reproduced
  natively by `NetworkPhoto`, so ~97% of catalogue imagery needs no network at all.
- Recommendations and the AI talking-point are computed on-device.
- Works with no internet — phone and display only need the same WiFi.
- Auth/checkout/customers use `Mock*` repositories → **no persistence**.

**Backend mode** (`--dart-define=BACKEND=true --dart-define=BACKEND_HOST=<lan-ip>`)
- Catalogue, auth, customers, cart, checkout and journey logging go over HTTP to the Node
  server; realtime goes through the server's WS relay.
- Data persists to SQLite and is visible in the CMS.
- Requires the Node server reachable on the LAN.

The mobile app also exposes an in-app **Server settings** sheet that persists a runtime
override (SharedPreferences) — it wins over the compile-time default.

**Configuration.**

| Define / env | Default | Applies to | Purpose |
|---|---|---|---|
| `BACKEND` | `false` | Both apps | `true` = Node backend, `false` = box-as-server |
| `BACKEND_HOST` | `10.0.1.12` | Both apps | Server LAN IP (backend mode) |
| `BACKEND_PORT` | `3000` | Both apps | Server port |
| `PORT` | `3000` | server | HTTP + WS port |
| `INGEST_URL` | *unset* | server | Remote catalogue refresh source |
| `DB_PATH` | — | server, cms | Shared SQLite file |
| `ANTHROPIC_API_KEY`, `AI_MODEL` | — | cms | AI enrichment |
| `R2_*` | — | cms | Cloudflare R2 image uploads |

Android manifests enable `INTERNET`/`CAMERA`, `usesCleartextTraffic` (for `ws://` LAN
traffic) and disable Impeller (required for `video_player` + `flutter_svg` on the boxes).

## §12. Build & run

```
# 1) Dependencies
cd server && npm install
cd ../cms && npm install
cd ../frontend/mobile_app && flutter pub get
cd ../display_app        && flutter pub get

# 2) Offline demo (default) — no backend needed
cd frontend/display_app && flutter run    # start the display FIRST
cd frontend/mobile_app  && flutter run    # scan the QR on the display

# 3) Persisted demo
cd server && npm start                    # :3000, seeds on first run
cd cms    && npm run dev                  # :4000
flutter run --dart-define=BACKEND=true --dart-define=BACKEND_HOST=192.168.1.5
```

`npm test` runs the Playwright API + WS suite; `npm run db:check` is a SQLite smoke test.
Release builds: `flutter build apk --release [--dart-define=…]`. After editing products in
the CMS, re-export the offline bundle with `node scripts/export-catalog.mjs`.

## §13. Known limitations

- **Box mode has no persistence.** Auth, checkout and customer capture use `Mock*`
  repositories — orders and guests are not saved and never reach the CMS. Use backend mode
  when data must persist.
- **The Node server does not run on the Android box.** Backend mode requires the server on
  a laptop/host on the LAN; Node + `better-sqlite3` need Termux (fragile) or a Dart
  re-implementation to truly live on the box.
- **Salesperson profile is local-only** (SharedPreferences, per device) — no API.
- **Customer styling fields are session-scoped.** Name, mobile, gender, age range,
  personality, occasion and "wearing" notes persist via `/customers`; DOB, occupation,
  fashion style, colours, fit, size, budget, brands, notes and the repeat flag have no
  backend column yet and are modelled for a future API.
- **No profile photo picker** — the model has `photoPath`; the UI falls back to initials.
- **Missing user fields** — no email, avatar, role/permissions, last-login or member-since
  exposed by the auth API.
- **Cloud images need internet.** ~17 catalogue images are Cloudflare R2 URLs; the other
  ~593 are on-device placeholders and work fully offline.
- **`ingest/` is scaffolded but unwired** — needs `INGEST_URL` and a source feed.
- **Two Flutter apps duplicate shared files** — synced by hand.
- **No update endpoint for customers** (`POST` only), so profile edits stay local.
- **`PROTOCOL.md` is frozen** — changes must be announced to both sides.

## §14. Roadmap

**Near term**
- Persistence for box mode (on-device SQLite via `drift`/`sqflite`) so orders and guests
  survive an offline session, syncing to the backend when online.
- Backend columns + `PATCH /customers/:id` for the full guest profile.
- Salesperson profile API (`PATCH /auth/me`) incl. email, avatar upload, role.
- Bundle the remaining R2 images for a 100% offline catalogue.

**Medium term**
- Run the server on the box itself (Node in Termux with `node:sqlite`, or a Dart HTTP/WS +
  SQLite server inside the display app).
- Wire `ingest/` for scheduled catalogue refresh.
- Extract the duplicated Flutter foundation into a shared package.
- Real AI talking points via the Anthropic SDK with an offline template fallback.

**Longer term**
- Analytics: per-associate journey replay and conversion reporting in the CMS.
- Multi-display / multi-session support per store.
- Role-based access control and audit trails.
- Automated widget/integration test coverage for both Flutter apps.

## §15. Repository map

```
Fashion_app/
├─ frontend/
│  ├─ mobile_app/     # Salesperson controller (Flutter, portrait)
│  └─ display_app/    # Customer display (Flutter, dark, full-bleed)
├─ server/            # Node + Express + ws + better-sqlite3
├─ cms/               # Next.js 15 + MUI admin
├─ shared/schema.sql  # the SQLite data shape (contract)
├─ media/             # media served from box disk
├─ docs/              # API.md, Architecture.md, FolderStructure.md, this brief
├─ PROTOCOL.md        # frozen WebSocket contract
├─ REQUIREMENTS.md    # full product + technical spec
├─ PROJECT_TODO.md    # living backlog
└─ CLAUDE.md          # read-first for AI coding sessions
```

## §16. The closing line

**The guest sees the piece. Never the phone.**
Private cockpit · editorial stage · event sync · offline by default.

---

*Source: this brief is condensed from `README.md`, `PROTOCOL.md`, `CLAUDE.md` and
`docs/` — the application as actually built. A generated deck already exists at
`docs/Fashion_Showroom_Deck.pptx`, produced by `scripts/make_ppt.py`.*
