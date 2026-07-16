# Frontend Integration Guide — Fashion Showcase

For the frontend team building the **Display** (TV) and **Controller** (mobile/tablet) apps.
Read this with [`../PROTOCOL.md`](../PROTOCOL.md) (the WS contract) and
[`../shared/schema.sql`](../shared/schema.sql) (the data shape).

## The big picture

The controller tells the display what to show. There is **no screen mirroring** and **no AI on
the frontend** — product "AI enrichment" is pre-authored data you just render. Two transports:

- **HTTP (Express)** — bulk data: catalog, search, product detail (enrichment + variants +
  media), and the media files themselves. Request/response.
- **WebSocket** — the real-time control channel: pairing, "show this on the TV", and session
  lifecycle. Tiny messages carrying **IDs only**.

Rule of thumb: **HTTP fetches the data; WS carries the commands.** A `show_product` message is
tiny because both apps already have the product data cached from HTTP.

## Boot → Pair → Hydrate → Interact

1. **Boot** — the TV opens a WebSocket to the server. The **server** issues a `pairingToken`
   for that display; the TV renders it as a QR code encoding
   `http://<box-ip>:<port>/pair?token=xyz` (this URL opens the controller app).
   **The TV also hydrates the catalog over HTTP on boot and caches it locally.**

2. **Pair** — the salesperson scans the QR with the controller app. The controller opens a
   WebSocket and emits `pair { pairingToken }`. The server matches the token to the display,
   binds them into one session, and sends `paired { sessionId, displayId }` to both.

3. **Hydrate (HTTP)** — the controller loads the catalog / search / product detail from the
   Express endpoints into local state. (Can begin on app-load, in parallel with pairing.)

4. **Interact (WS)** — when the salesperson taps a product, the controller emits
   `show_product { productId }`. The server relays it to the TV, which renders the product from
   its **cached** data. Same pattern for `show_related { productId, mediaId }` (model video /
   alternate media) and color variants (`show_product { productId, variantId }`).

5. **Idle / end** — after 10 min idle the server sends `session_warning { secondsLeft }` to the
   controller; a grace window follows; `keep_alive` (or any activity) cancels it, otherwise
   `session_end { reason }` goes to both and the TV returns to idle + QR for the next user.

## Why the TV hydrates too (important)

When `show_product { productId }` arrives, the TV has to render that product — so the TV needs
the data, not just the controller. Both apps hydrate over HTTP and cache; WS messages then carry
only IDs. This keeps messages tiny **and** keeps the TV working offline from cache.

## Frontend responsibilities

**Display (TV)**
- On boot: open WS, render the pairing QR from the server-issued token, hydrate + cache the
  catalog over HTTP, show the idle/ad loop.
- Render on command: product detail with enrichment, color-variant swap, related media (video),
  idle screen on `clear` / `session_end`.

**Controller (mobile/tablet)**
- Scan QR → open WS → `pair`. Hydrate catalog over HTTP.
- Search → pick → emit `show_product`. Show related content → `show_related`.
- **Cart is controller-side state** — the shortlist lives in the app; the default cart item
  auto-emits `show_product`; tapping a cart item re-emits `show_product`. No server message for
  cart.
- Handle `session_warning` (show "session ending soon" + a keep-going action → `keep_alive`).

## Contract notes

- Message names and payloads are **frozen** in `PROTOCOL.md` — build against them exactly.
- Every controller command implicitly counts as activity (resets the idle timer).
- No API keys, no AI SDK on the frontend. Enrichment = data rendered on screen.

## HTTP endpoints (build against these)

Full request/response shapes are in [`API.md`](API.md). Quick map:

- `GET /api/products?q=&category=&color=&size=&minPrice=&maxPrice=&sort=&order=&limit=&offset=` — catalog / search / sort / filter
- `GET /api/products/:id` — detail (enrichment + variants + media)
- `GET /api/products/:id/similar` — cross-product "show similar" (P2)
- `GET /api/categories`, `GET /api/filters` — filter UIs
- `POST /api/customers` — capture (name/mobile/gender/age all optional)
- `GET /api/cart/:sessionId`, `POST/PATCH/DELETE .../items`, `PUT .../default`, `DELETE /api/cart/:sessionId` — cart
- `GET /media/*` — images (SVG placeholders today; real files later)

WebSocket: `ws://<box-ip>:3000/ws?role=display|controller` — messages in [`../PROTOCOL.md`](../PROTOCOL.md).

> Media today are generated SVG placeholders labelled with the real product/colour, so the
> catalog renders fully offline. Swap for real assets by dropping files in `media/` and updating
> the seed/ingest `mediaUrl`s — the FE contract doesn't change.
