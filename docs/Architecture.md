# Architecture

## Principles
- **Feature-first**, layered per app: `core/` (theme, realtime, router), `models/`,
  `data/` (repositories), `features/<feature>/` (controller + screens), `widgets/`.
- **No hardcoded design values** — everything derives from `core/theme` tokens.
- **Backend-ready via interfaces** — repositories and the realtime channel are
  abstractions; mock implementations power the POC and are swapped for real ones
  with no UI change.

## State management
`provider` + `ChangeNotifier` controllers:
- Mobile: `CatalogController`, `CartController`, `ConnectionController`,
  `PresentationController`.
- Display: `DisplayController` (phase FSM + event reducer).

## Live Presentation Synchronization
The customer display is a **thin renderer with a phase state machine**
(`DisplayPhase`). Once a product is presented, the synchronized sub-state is
`ProductPresentation`, updated by a **pure reducer** `applyEvent(WsEvent)` that
runs identically on both apps, so they stay in lock-step.

Events (`WsEvent` / `WsEventType`) carry only ids + transform params
(`showProduct`, `changeColor`, `zoomImage`, `panImage`, `playVideo`,
`showAIHighlights`, `paymentSuccess`, `sessionTimeout`, …). High-frequency
gestures (zoom/pan) are throttled before emission.

## Connectivity
LAN-first, Android-hosted server (see REQUIREMENTS §5). QR encodes
`http://<box-ip>:<port>/pair?token=…`. Mobile scans → `pair {token}` →
server binds → `paired {sessionId, displayId}`. Catalogue is hydrated over HTTP
and cached, so realtime frames stay tiny. For the POC the server is simulated by
an in-app loopback (`MockRealtimeService`); `web_socket_channel` is wired for the
real transport.

## Money
`Money` stores **minor units** (integer cents) — no floating-point drift. Cart
totals mirror what the server will compute in production.
