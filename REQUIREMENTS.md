# Fashion Showroom POC — Requirements Specification

> **Status:** DRAFT — awaiting client verification.
> **Nothing has been built yet.** No git, no monorepo, no code. This document is the
> single source of truth to be approved before any implementation begins.
>
> **Repo (target):** https://github.com/RohithEB/Fashion_app.git
> **Type:** Proof of Concept (POC) — but the architecture must be production-ready and
> scalable into a real SaaS product. No throwaway code, no hardcoded business logic.

---

## 1. Product Summary

A **premium luxury fashion showroom** system for high-end boutiques. A sales associate
uses a **mobile app** to privately browse an AI-enriched catalog and **push selected
content to a large in-store display (TV)** that the customer watches. It is a guided,
concierge-style selling experience — **not** an e-commerce app and **not** screen mirroring.

### 1.1 The Golden Rule (highest-priority UX requirement)
**THIS IS NOT SCREEN MIRRORING.** The customer must **never** see the salesman browsing,
searching, or changing variants. The display changes **only** when the salesman explicitly
pushes content to it (e.g. "Show on Screen", or selecting a product from the cart). Until
then, the display stays on its current curated state (Welcome / current product / idle).

---

## 2. Actors & Applications

| App | Runs on | Role |
|-----|---------|------|
| **Mobile App** (Salesman / Controller) | Phone / tablet (Android, iOS) | Private cockpit: login, pair to a TV via QR, search, browse AI-enriched products, manage cart, drive the display, checkout, payment. |
| **Display App** (Customer TV) | **Android TV *and* Android tablet-kiosk** (responsive), landscape, up to 4K | Hosts the in-store experience: splash, ad/idle loop, QR pairing screen, welcome, product presentation, gallery, video, thank-you. **Renders only what it is told to render.** |
| **Backend / Server component** | **Runs on the Android display device (LAN)** for the POC — see §5 | Auth/pairing, session management, catalog, AI-enriched content, cart/order, realtime control channel (WebSocket), REST APIs. |
| **Admin App** *(optional, later phase)* | Tablet / web | Catalog & screen management, monitoring. |

---

## 3. High-End Sales Experience (NEW — enriched flow)

This is the differentiating flow for the luxury/high-end version:

1. **Multiple products, enriched by AI.** Each product carries AI-generated enrichment
   (rich descriptions, styling notes, related content, colorways, etc. — see §3.1).
2. **Search & shortlist.** The salesman searches; from the result list he **opts** which
   product(s) to display and/or add to the **Cart**.
3. **Cart = shortlist + display controller.**
   - Adding a product to the cart, by default, **displays it in the main display area** (the "hero" product on the TV).
   - When helping a customer choose between shortlisted items, the salesman **opens the cart** and, **by touch, selects any product to display on screen** — instant switching between shortlisted looks.
4. **Related content per product.** For the product currently on screen, the salesman can push:
   - **Video** of a model wearing the outfit.
   - **Available colors / variants** — show the same dress in its other colorways.
   - **Gallery** of additional imagery.
5. The customer explores the product on the big screen while the salesman narrates and
   switches looks from the phone.

### 3.1 AI Enrichment — scope ✅ DECIDED
- **What it produces:** enriched product descriptions, styling/pairing suggestions,
  "related content" links (model video, colorway set), auto-tags/search keywords.
- **How it is delivered:** the **backend clothes/catalog API serves pre-seeded enriched
  product data**. Enrichment is generated once and stored as seed data; **no live/runtime AI
  calls in the apps** for the POC. The enrichment source is abstracted so a real AI service
  can replace the seed later without touching client code.

---

## 4. End-to-End Session Flow

```
DISPLAY boots
  → Splash
  → Advertisement / Idle loop
  → "Waiting for Sales Associate" + QR CODE (pairing URL/code)
        │
        │  Salesman opens Mobile App → Login → scans QR → pairs to THIS TV (over WiFi/LAN)
        ▼
  → Display: Loading
  → Welcome Screen  ("You're now connected with {Salesman Name} …")
        │
        │  Salesman privately searches & shortlists (customer still sees Welcome)
        ▼
  → Product Display        ◀── salesman "Show on Screen" / adds to cart (hero)
     ├─ switch look        ◀── salesman taps a different cart item
     ├─ Gallery            ◀── salesman pushes gallery
     ├─ Video (model)      ◀── salesman pushes video
     └─ Colors/Variants    ◀── salesman pushes colorway set
        │
        │  Cart → Checkout → Payment
        ▼
  → Payment Success
  → Thank You Screen (60-second timer)
  → Session Ends → back to Advertisement / Idle loop + QR
```

### 4.1 Idle & pairing lifecycle (NEW)
- The TV displays a **QR code** encoding the pairing URL/code when unpaired.
- A salesman **scans to connect** to that specific TV over the local WiFi network.
- **10-minute idle timeout:** if a paired session is idle for **10 minutes**, the session is
  **auto-disconnected**, the content is torn down, and the device returns to the
  idle/waiting state and becomes **available for another user to pair**. *(Confirm: is "idle"
  = no controller activity? Does it warn before disconnecting? — §12.)*
- **60-second Thank-You timer** ends a completed session and returns to idle (separate from
  the 10-min idle timeout).

---

## 5. Technical Architecture — Connectivity ✅ DECIDED: LAN-first, Android-hosted server

Driven by the requirement: *"This solution needs to work in a WiFi network. A server
component will run on Android and expose a URL as a QR code. Sales team can scan and connect
to that particular TV."* Chosen for being the **lightest and fastest** option that works with
**no internet dependency**.

**POC topology: LAN-first, Android-hosted server.** The TV-hosted server is exactly the
**backend that exposes the clothes/catalog API** (REST) plus the realtime control channel (WS).
```
        WiFi LAN (no cloud dependency for POC)
┌──────────────────────────────┐            ┌───────────────────────────┐
│  ANDROID DISPLAY (TV)         │            │  SALESMAN MOBILE          │
│  ├─ Display UI (Flutter)      │            │  ├─ Controller UI(Flutter)│
│  ├─ Embedded SERVER           │◀── QR ────▶│  └─ scans QR → connects   │
│  │   • REST + WebSocket       │  pairing   │       over LAN            │
│  │   • Session/pairing        │            │                           │
│  │   • Catalog + AI data(seed)│◀═ REST ═══▶│  browse / cart / control  │
│  │   • authoritative display  │◀═ WS  ════▶│  push commands            │
│  │     state                  │            │                           │
└──────────────────────────────┘            └───────────────────────────┘
```
- The **TV device is self-contained**: it hosts the server, catalog (seeded), and the
  authoritative session/display state. The mobile is a pure LAN client.
- **QR content:** the display's LAN URL (e.g. `http://<tv-ip>:<port>`) and/or a short
  pairing code + session token.
- **Abstraction for scalability:** all client access goes through **transport-agnostic
  repository interfaces**, so the same client code can later target a **cloud backend**
  instead of the LAN server without rewriting features. This preserves the "scale into SaaS"
  goal while keeping the POC LAN-only.

**Future scale-up path (not POC):** the same client repository interfaces can later point at
a **cloud backend** (hybrid: LAN realtime + cloud catalog/AI/orders, or fully cloud) without
rewriting features. The LAN server is the POC default.

---

## 6. Functional Requirements

### 6.1 Mobile App (Salesman / Controller)
- Login / authentication.
- Discover & **pair to a TV by scanning its QR** (camera + QR decode).
- View list of available screens / current pairing status.
- **Product search** (fast, keyword) over the AI-enriched catalog.
- **Categories** browsing.
- **Product detail** (variants: size, color; imagery; AI description; related content).
- **Push to display:** "Show on Screen", switch look, push gallery / video / colorways.
- **Cart:** add/remove; adjust **quantity, size, color**; see **price, discount, tax, total**;
  cart doubles as the **on-screen shortlist selector** (touch to display any item).
- **Checkout → Payment → Success** (payment gateway is modular/mocked for POC — §6.4).
- Clear, always-visible indicator of **"what the customer currently sees."**
- Graceful handling of disconnect / re-pair.

### 6.2 Display App (Customer TV)
- Splash, advertisement/idle loop, **QR pairing/waiting screen**.
- Loading, **Welcome** ("connected with {Salesman Name}"), product display (hero),
  gallery, **video player**, colorway/variant showcase, checkout success, **Thank You**,
  disconnect state.
- **Thin renderer with its own finite-state machine**; holds no browsing state; transitions
  only on (a) local timers or (b) commands received from the controller/server.
- Optimized for **large TV / 4K / landscape**, big readable typography, premium imagery.
- Self-heal on reconnect (re-fetch "current display state").

### 6.3 Backend / Server (on Android for POC)
- **Auth & pairing** (issue/verify pairing token; QR generation).
- **Screen/session management** (create, track, **10-min idle auto-end**, 60s thank-you end).
- **Products / catalog** (seeded, AI-enriched) + search + categories.
- **Inventory** (basic, for variant availability display).
- **Cart & Orders** — **all money math (subtotal, discount, tax, total) computed server-side.**
- **Payments** — modular gateway abstraction (fake gateway for POC).
- **WebSocket control channel** + **REST APIs**.
- Authoritative **display state** persisted so displays can self-heal.

### 6.4 Payment
- **Modular by design.** A `PaymentGateway` abstraction with a **Fake/Mock gateway** for the
  POC. Real gateway integration is a later, drop-in replacement. No gateway lock-in.

---

## 7. Realtime / Control Channel

- **WebSocket** over LAN between mobile and the TV-hosted server.
- **Typed message envelope** (shared model), e.g.
  `{ id, type, sessionId, senderRole, payload, ts, seq }`.
- Command types: `PAIR`, `WELCOME`, `SHOW_PRODUCT`, `SWITCH_LOOK`, `SHOW_GALLERY`,
  `SHOW_VIDEO`, `SHOW_COLORWAYS`, `THANK_YOU`, `IDLE`, `HEARTBEAT`, `ACK`, `DISCONNECT`.
- **Server is authoritative**: mobile → server command → server validates & persists display
  state → server drives the display. Display never trusts the mobile directly.
- **Reconnection** (backoff), **heartbeat/idle detection** (feeds the 10-min timeout),
  **idempotency** (envelope id), **sequence numbers** for ordering/self-heal.

---

## 7A. Live Presentation Synchronization (NEW) ✅ REQUIRED

**This is NOT screen mirroring — it is event-based Live Presentation Synchronization.**
The phone screen is never streamed. Lightweight WebSocket *events* describe interactions,
and the display reproduces them locally from its cached data.

**Two modes**
- **Private mode (default):** salesperson browses/searches/filters/navigates freely on
  mobile. **None of this reaches the display.**
- **Presentation mode:** begins only on **"Show on Screen"** (`showProduct`). From then on,
  the presented product is **synchronized** — a defined set of mobile interactions is mirrored
  to the display *as events*.

**Synchronized interactions:** pinch-to-zoom, pan, reset zoom, swipe/change gallery image,
change color, change size (visual), rotate 360° (future-ready), play/pause/seek video,
mute/unmute (optional), open specifications, show AI highlights, show related media.

```
Salesperson pinches to zoom
  → Flutter detects the gesture
  → emits WebSocket event  zoomImage { scale, focalX, focalY }
  → display receives the event
  → display applies the same zoom level & position (from its cached image)
Customer sees a seamless live presentation — no phone-screen mirroring.
```

**Extended event protocol** — envelope `{ id, type, sessionId, senderRole, payload, ts, seq }`,
`type` ∈:

| Group | Events |
|-------|--------|
| Session | `connectScreen`, `disconnectScreen`, `sessionTimeout` |
| Presentation | `showProduct`, `hideProduct` |
| Image | `zoomImage`, `panImage`, `resetZoom`, `changeImage` |
| Variant | `changeColor`, `changeSize`, `rotateProduct` |
| Video | `playVideo`, `pauseVideo`, `seekVideo`, `muteVideo` |
| Enrichment | `showAIHighlights`, `showRelatedMedia` |
| Commerce | `updateCart`, `checkout`, `paymentSuccess` |

Principle: **event synchronization over video streaming**. Events are small (ids + transform
params); the display already holds the catalog (hydrated over HTTP) and renders from cache.
High-frequency gestures (zoom/pan) are throttled/coalesced before emission.

---

## 8. Non-Functional Requirements
- **Production-ready architecture** despite POC scope: Clean Architecture, Feature-First,
  Repository Pattern, SOLID, DI, modular, strongly typed, null-safe, documented, reusable.
- **Scalable:** LAN server abstracted so it can be swapped for cloud later; multi-tenant-ready
  data model direction.
- **Offline/resilience:** display caches idle assets and last display state; mobile caches
  catalog; command queue + dedupe on reconnect; graceful "reconnecting" states.
- **Error handling:** typed failures, no silent failures, centralized mapping, consistent
  loading / empty / error UI states.
- **Security (POC-appropriate):** pairing token scoped to a session/TV; role-checked commands.

---

## 9. Monorepo & Tooling (proposed — pending confirmation, §12)
- **Melos**-managed Flutter monorepo (+ Dart pub workspaces for a single lockfile).
- Client requested a **`frontend/` folder** — proposed reconciliation:
  ```
  Fashion_app/
  ├─ frontend/              # Flutter monorepo (Melos root)
  │  ├─ apps/ (mobile_app, display_app, admin_app*)
  │  └─ packages/ (core, models, network, websocket, storage, repositories,
  │                session_engine, payment, ui_kit, theme, shared_widgets,
  │                authentication, analytics, logger, utils)
  ├─ backend/               # server component (see §5 / §12 for language choice)
  ├─ docs/                  # Architecture.md, FolderStructure.md, Contribution.md, Roadmap.md
  ├─ tools/  ├─ scripts/  └─ .github/ (issue + PR templates, workflows)
  ```
- Strict `analysis_options.yaml` / lint rules; VS Code + Android Studio + Flutter config.
- Docs to generate in Phase 1: `README.md`, `Architecture.md`, `FolderStructure.md`,
  `Contribution.md`, `Project Roadmap.md`.
- **Git:** `git init` → remote `origin` = the repo URL → initial commit → push to `main`
  (detect existing remote/branch; handle auth errors gracefully). **Only after this doc is
  approved.**

### 9.1 Proposed technical decisions (need your confirmation — §12)
| Concern | Recommendation | Note |
|---------|----------------|------|
| State management + DI | **Riverpod v2 (codegen)** | Session/Display lifecycle as an explicit FSM package. |
| Navigation | **go_router** | Declarative, guards, deep links. |
| Server language | **Dart** (Dart Frog or `shelf`) embedded on Android | Shares the `models` package → one source of truth. |
| Local storage | Isar/Hive + secure storage | Catalog cache, tokens, offline. |
| QR | `mobile_scanner` (scan) + `qr_flutter` (render) | — |

---

## 10. Design System Requirements (Luxury / Premium)

A **complete, centralized, reusable design system** is required **before** any screen is
designed. Feel target: a blend of **Apple Store, Zara, Louis Vuitton, Gucci, Dior, Tesla UI,
Nothing OS, Linear.app, Shopify POS** — clean, premium, elegant, minimal, modern, expensive,
fast, sophisticated. **Never** feel like a typical shopping app. **No hardcoded** colors,
spacing, typography, or dimensions — everything from central tokens.

**Deliverable order (per client's design prompt):**
1. First produce a **Design Strategy document** covering: Design Philosophy, Visual Identity,
   UX, Color Psychology, Typography, Spacing, Elevation, Iconography, Motion, Component System,
   Responsive Strategy, Accessibility, Theme Architecture — **then STOP for approval.**
2. Then build the **design tokens & Material 3 theme**, then components, then screens.

**Must include:**
- **Semantic color system** (light + dark): primary, secondary, accent, success, warning,
  error, info, surface, background, card, divider, border, hover, pressed, disabled, focus,
  overlay, skeleton, loading, shimmer, textPrimary/textSecondary — named as `AppColors.*`.
- **Material 3 theme** wiring every component theme (ColorScheme, TextTheme,
  InputDecoration, Buttons, NavigationBar, AppBar, Card, Dialog, SnackBar, BottomSheet,
  ProgressIndicator, Chip, Tooltip, Menu, Switch, Checkbox, Radio, Slider, TabBar, Divider,
  Scrollbar, ListTile, ExpansionTile, FAB, DatePicker, TimePicker).
- **Typography:** recommended Google Font + hierarchy (Display, Headline, Title, Body, Label,
  Caption, Button) with rationale.
- **Design tokens:** spacing (8-pt: 4→64), radius (sm/md/lg/xl/pill/circular), elevation,
  opacity, animation durations & curves, icon sizes, image ratios, button/input heights.
- **Iconography** recommendation (Material Symbols Rounded / Cupertino / Lucide) with rationale.
- **Motion design:** navigation, transitions, loading, cards, images, hero, product switching,
  button press, dialog, bottom sheet, success, checkout — restrained, not excessive.
- **Reusable components:** buttons, cards, search bars, navigation, product/category cards,
  dialogs, bottom sheets, loaders, badges, tags, quantity selector, variant selector, cart
  item, checkout summary, payment card, success dialog, empty/error/loading states.
- **Responsive strategy:** mobile, tablet, Android TV, landscape/portrait, large displays.
- **Accessibility:** high contrast, readable fonts, adequate touch targets, screen-reader
  support, TV keyboard/D-pad navigation.

---

## 11. Development Phases (STOP & get approval after each)
- **Phase 1:** Monorepo scaffold + tooling + docs + Git init & push. No features.
- **Phase 2:** Design System (strategy → approval → tokens/theme/components).
- **Phase 3:** Foundations — core/models/network/websocket/storage/theme + server skeleton
  (auth/pairing + WS echo).
- **Phase 4:** Pairing via QR + session connect + Display FSM + Welcome flow.
- **Phase 5:** AI-enriched catalog: search, categories, detail, variants, **push-to-display**,
  cart-as-shortlist-selector, related content (video/colorways/gallery).
- **Phase 6:** Cart → checkout → modular payment (fake) → success/thank-you → idle/pairing
  lifecycle (10-min timeout).
- **Phase 7:** Offline, error hardening, analytics/logging, admin app basics, polish.

---

## 12. Decisions Log

### ✅ Confirmed by client
1. **Connectivity topology:** **LAN-first, Android-hosted server** (lightest/fastest, offline).
   This server exposes the **clothes/catalog API** + realtime control channel.
2. **AI enrichment:** **pre-seeded enriched data served via the backend clothes API** (no live
   AI in-app for POC), abstracted for a future real service.
3. **Monorepo layout:** **`frontend/` + `backend/` siblings** (§9).
4. **Display hardware:** **both Android TV and Android tablet-kiosk** — responsive display app.

### 🔧 Proposed defaults (assumed unless you object)
5. **Tech stack (§9.1):** Riverpod v2 (codegen) + go_router + Dart LAN server (`shelf`/Dart
   Frog) sharing the `models` package. QR via `mobile_scanner` + `qr_flutter`.
6. **Idle timeout semantics:** "idle" = **no controller input for 10 min**; a short on-screen
   countdown/warning before auto-disconnect; an actively-shown product does **not** by itself
   count as activity (controller interaction does).
7. **Payment:** **Fake/mock gateway only** for POC; abstraction shaped to drop in a real
   gateway (e.g. Stripe/Razorpay) later.
8. **Admin app:** **deferred to a later phase**; not scaffolded in Phase 1.

---

*End of requirements. Decisions 1–4 are locked; 5–8 are my defaults — tell me if any should
change. On your go-ahead I proceed to **Phase 1** (monorepo scaffold → docs → git init →
push to `main`). Note: pushing to your GitHub repo is the one step I'll confirm with you
before executing.*
