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
├─ docs/              # Architecture & structure notes
├─ REQUIREMENTS.md    # Full product + technical spec (source of truth)
├─ PROJECT_TODO.md    # Hierarchical, living backlog
└─ README.md
```

Two independent Flutter apps (no shared packages by design). Shared foundation
(theme, models, realtime, mock data, common widgets) is authored with relative
imports and kept in sync across both `lib/` trees.

## Tech stack

- **Flutter 3.41 / Dart 3.11**, Material 3.
- **provider** — state management & DI (`ChangeNotifier` controllers).
- **go_router** — declarative navigation with auth/pairing guards (mobile).
- **google_fonts** — Cormorant Garamond (display serif) + Inter (UI).
- **material_symbols_icons** — rounded icon set.
- **mobile_scanner** (mobile, QR scan) · **qr_flutter** (display, QR render).
- **web_socket_channel** — realtime transport (behind an abstraction; a mock
  in-app loopback powers the POC, a real Android-hosted LAN server drops in later).

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
  (seeded, AI-enriched); swap for HTTP later with no UI change.
- **Realtime** (`core/realtime/`) — `RealtimeService` interface, `MockRealtimeService`
  loopback for the POC.
- **Feature-first** `features/` folders, each with its controller + screens.

## Running

Prerequisites: Flutter 3.41+.

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

### Demo flow (no backend needed)
1. **Display app** boots → splash → advertisement loop → **waiting screen with QR**.
   *Tap the display anywhere* to run a hands-free scripted session (connect →
   welcome → product → colour change → AI notes → next product → thank-you).
2. **Mobile app** → pick an associate → **Connect to demo display** (or scan a QR)
   → browse the collection → open a product → **Show on Screen** → change colour /
   toggle atelier notes → open the **Cart** and tap **Present** on any item to
   switch the look live → **Checkout → Pay** → display shows **Thank You**.

## Status

Milestone 1 complete: both apps build clean and run the full premium UI flow on
mock data with event-based live sync. Backend integration points are stubbed
behind interfaces. See `PROJECT_TODO.md` for the remaining backlog and
`REQUIREMENTS.md` for the full spec.
