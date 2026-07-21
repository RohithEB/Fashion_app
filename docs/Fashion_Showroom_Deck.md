---
marp: true
theme: default
paginate: true
size: 16:9
title: "Maison Ébani — Fashion Showroom"
description: "A guided luxury selling experience. Private cockpit, editorial stage, event sync, offline by default."
style: |
  :root {
    --ink:       #0E0E10;
    --ink-soft:  #1A1A1E;
    --ivory:     #F5F2EC;
    --muted:     #9A9790;
    --champagne: #C6A664;
    --line:      #333338;
  }
  section {
    background: var(--ink);
    color: var(--ivory);
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    font-size: 22px;
    padding: 56px 64px 64px;
  }
  h1, h2 {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-weight: 400;
    color: var(--ivory);
    letter-spacing: .2px;
  }
  h1 { font-size: 62px; margin: 0 0 .2em; }
  h2 { font-size: 40px; margin: 0 0 .1em; }
  h2::after {
    content: "";
    display: block;
    width: 92px; height: 2px;
    background: var(--champagne);
    margin: 18px 0 26px;
  }
  h6 {                      /* kicker */
    font-family: "Inter", "Segoe UI", sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--champagne);
    margin: 0 0 10px;
  }
  strong { color: var(--champagne); font-weight: 600; }
  em     { color: var(--muted); font-style: italic; }
  ul { line-height: 1.5; }
  li { margin-bottom: .55em; }
  li::marker { color: var(--champagne); }
  a { color: var(--champagne); }
  pre, code {
    font-family: "Consolas", "JetBrains Mono", monospace;
    background: var(--ink-soft);
    color: var(--ivory);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  pre { font-size: 15px; line-height: 1.35; padding: 20px 24px; }
  code { font-size: .92em; padding: 1px 5px; border: none; }
  table { border-collapse: collapse; font-size: 18px; width: 100%; }
  th {
    color: var(--champagne);
    text-align: left;
    font-weight: 700;
    border-bottom: 1px solid var(--line);
    padding: 10px 14px;
  }
  td { color: var(--muted); border-bottom: 1px solid var(--line); padding: 9px 14px; }
  td:first-child { color: var(--ivory); }
  tr:nth-child(even) td { background: var(--ink-soft); }
  section.lead { justify-content: center; }
  section::after {                    /* page number */
    color: var(--muted);
    font-size: 13px;
  }
  .cols   { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .cols-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; }
  .cols > div, .cols-3 > div, .cols-2 > div {
    background: var(--ink-soft);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 20px 22px;
    font-size: 17px;
  }
  .cols h3, .cols-3 h3, .cols-2 h3 {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-weight: 400;
    color: var(--champagne);
    font-size: 24px;
    margin: 0 0 4px;
  }
  .cols .sub, .cols-3 .sub, .cols-2 .sub {
    color: var(--muted); font-size: 14px; margin: 0 0 14px;
  }
  .cols ul, .cols-3 ul, .cols-2 ul { margin: 0; padding-left: 18px; }
  .cols li, .cols-3 li, .cols-2 li { margin-bottom: .45em; line-height: 1.35; }
  .note { color: var(--muted); font-size: 18px; margin-top: 22px; line-height: 1.45; }
---

<!--
Fashion Showroom — presentation deck (Markdown source).

Render:
  npx @marp-team/marp-cli docs/Fashion_Showroom_Deck.md -o deck.pdf
  npx @marp-team/marp-cli docs/Fashion_Showroom_Deck.md -o deck.pptx
  npx @marp-team/marp-cli -s docs/          # live preview server
Or open in VS Code with the "Marp for VS Code" extension.

Presenter notes are the HTML comments beneath each slide — they are the spoken
script and do not render on the slide.
-->

<!-- _class: lead -->
<!-- _paginate: false -->

# Maison Ébani

### Fashion Showroom — a guided luxury selling experience

A salesperson's phone privately drives a large in-store display.
**Not screen mirroring** — event-based Live Presentation Synchronization.

*Proof of Concept · Flutter mobile + display · Node/SQLite backend · Next.js CMS*

<!--
Open on the tension, not the tech. "Luxury retail has a five-inch problem." Land
the one-line positioning — private cockpit for the associate, editorial stage for
the guest — and promise the demo at the end. Sixty seconds, no more.
-->

---

###### The problem

## "Here, look at my phone."

- **The moment breaks the sale.** A five-inch screen, held sideways, with the associate's private notes, prices-in-progress and UI chrome all visible to the guest.
- **Mirroring is worse.** Streaming the phone shows every search, every mis-tap, every hesitation — and needs bandwidth a boutique WiFi rarely has.
- **Luxury retail needs two views.** A private, information-rich cockpit for the associate; a large, editorial, distraction-free stage for the customer.
- **And it must work offline.** In-store WiFi drops. The experience cannot.

<!--
Everyone in the room has lived this. Ask them to picture a €4,000 coat being sold
off a smudged phone screen. The offline point is the one clients underrate — say
plainly that boutique WiFi fails and the sale cannot fail with it.
-->

---

###### The solution

## One product, two screens, zero leakage

- **Private by default.** The associate browses, searches and filters freely. None of it reaches the display.
- **Presentation on demand.** "Show on Screen" starts the synchronized presentation — and only then.
- **Events, not video.** Tiny WebSocket messages (`show_product`, `change_colour`, `zoom`, `scroll`) describe the interaction; the display renders it from its own cached catalogue.
- **Offline-first.** Both apps ship a 37-product catalogue snapshot and draw ~97% of imagery on-device. Phone and display just need the same WiFi.
- **Production-shaped.** Layered backend, repository seams, a frozen protocol and e2e tests — a POC that scales into a product.

<!--
This is the whole pitch in one slide. If you only get five minutes, present slides
2 and 3 and stop. Emphasise the boundary: "Show on Screen" is the switch between
the two worlds, and nothing crosses it by accident.
-->

---

###### Architecture

## How the pieces fit

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

<p class="note">Backend is strictly layered: repositories (SQL) → services (business logic) → routes + ws. Frontend is feature-first: each feature owns its controller and screens.</p>

<!--
Trace one event end to end with your finger: associate pinches, the phone emits
zoom{scale,focalX,focalY}, the display applies it to its own cached image. Then
point at the transport box — the same apps run with or without the Node server.
-->

---

###### Applications

## Four independently runnable apps

<div class="cols">
<div>

### mobile_app
<p class="sub">Flutter · portrait · associate's phone</p>

- Login & salesperson profile
- QR pairing to a display
- Search, filter, colour explorer
- Product detail + live controls
- Saved outfits, checkout
- Private AI talking point

</div>
<div>

### display_app
<p class="sub">Flutter · dark, full-bleed · box/TV</p>

- Phase state machine
- Pairing QR + welcome
- Editorial product presentation
- Gallery, video, colourways
- Thank-you + idle return
- Hosts the LAN server in box mode

</div>
<div>

### server
<p class="sub">Node 20 · Express · ws · SQLite · :3000</p>

- Auth + bearer tokens
- Catalogue, search, filters
- Recommendations & talking points
- Cart, checkout, orders
- WS relay + session rules
- Playwright e2e suite

</div>
<div>

### cms
<p class="sub">Next.js 15 · React 19 · MUI 6 · :4000</p>

- Product CRUD with images
- AI enrichment via Claude
- Cloudflare R2 uploads
- Salespeople management
- Dashboard analytics
- Reads the same SQLite file

</div>
</div>

<!--
"Independently runnable" is the point — each app boots on its own, so the demo
degrades gracefully. Note that the CMS and the server share one SQLite file
rather than talking over an API; that is deliberate for a single-box deployment.
-->

---

###### Experience

## The session, end to end

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

<p class="note">Display phases: splash → advertisement → waiting (QR) → connecting → loading → welcome → presenting | catalogue | cart | checkout → thankYou → (countdown) → waiting. Idle handling: <code>session_warning</code> → grace → <code>session_end</code>.</p>

<!--
Stress that both profile steps are skippable with a prominent Skip — an associate
mid-rush will never fill a form, and the flow must not punish them. Then stress
the last line: ending a session re-issues a fresh QR, so the next guest is one
scan away.
-->

---

###### The differentiator

## Live Presentation Synchronization

- **The phone screen is never streamed.** A pinch-to-zoom emits `zoom { scale, focalX, focalY }`; the display applies the same transform to its own cached image.
- **Synchronized set.** Show / hide product · colour variant · size · image swipe · pinch-zoom · pan · detail-scroll · gallery grid · video play-pause-seek · reset view.
- **A pure reducer on both sides.** `ProductPresentation.applyEvent(WsEvent)` runs identically on mobile and display — the mobile mirrors exactly what the guest sees.
- **Cheap on the wire.** Payloads are ids plus transform parameters; high-frequency gestures are throttled and coalesced before emission.
- **Always-visible truth.** The associate always has a "now showing" indicator — no guessing what the customer can see.

<!--
The pure-reducer detail is the one engineers respond to: one function, run on both
devices, guarantees the two screens agree without the phone ever sending pixels.
If someone asks about latency, the answer is that a zoom event is tens of bytes.
-->

---

###### Protocol

## The frozen WebSocket contract

Envelope: `{ "type": "show_product", "sessionId": "sess_…", "payload": { … } }`

| Direction | Messages | Rule |
|---|---|---|
| Controller → server | `pair`, `activity`, `keep_alive` | Binds one controller to one display; resets the idle timer |
| Relayed commands | `show_catalog`, `show_cart`, `show_product`, `show_details`, `show_related`, `show_media`, `zoom`, `clear` | Allow-listed by `RELAY_TYPES` — anything else is rejected |
| Server → clients | `display_registered`, `paired`, `session_warning`, `session_end`, `error` | Server is authoritative; the display never trusts the mobile directly |
| Session lifecycle | 10-min idle → `session_warning` → grace → `session_end` | Ending frees the display and re-issues a fresh QR |
| Box mode | Richer `WsEvent` vocabulary, no relay translation | The display hosts the socket directly |

<!--
"Frozen" is a process claim, not a technical one: both sides build against
PROTOCOL.md and any change is announced. The allow-list is the security story —
an unknown message type is rejected, not forwarded.
-->

---

###### Backend

## HTTP API surface

Base URL `http://<host>:3000/api` · bearer token from login/register

| Endpoint | Purpose |
|---|---|
| `/auth/register` · `/login` · `/logout` · `/me` | Salesperson auth, bearer token |
| `/products` · `/products/:id` · `/:id/similar` | List, search, filter, sort, page; full detail; "show similar" |
| `/categories` · `/filters` | Facets — categories, colours, sizes, price range |
| `/recommendations` · `/talking-point` | Profile-matched picks; private coaching cue |
| `/customers` · `/customers/options` | Capture the session guest; onboarding choice lists |
| `/cart/:sessionId` (+ `/default`, `/checkout`) | Server-side cart, auto-displayed item, orders |
| `/orders/:id` · `/journey` · `/health` | Order detail, journey events, health probe |
| `/media/ph?w&h&bg&fg&text` | Generated SVG placeholder imagery — the offline image strategy |

<p class="note"><strong>Integration seam.</strong> The UI depends only on interfaces in <code>lib/data/</code>. Three implementations exist — <code>Mock*</code>, <code>Http*</code>, <code>BundledCatalogRepository</code> — chosen in <code>app.dart</code>. Adding an endpoint never requires touching a screen.</p>

<!--
Don't read the table. Point at two rows: /media/ph, which is why the catalogue
works offline, and /talking-point, which is the only AI surface in the live app.
Then land the integration seam — it is what makes cloud migration a config change.
-->

---

###### Feature set

## What is built

<div class="cols">
<div>

### Presentation & sync

- Show product / clear
- Colour variant, size
- Image swipe + gallery grid
- Fullscreen pinch-zoom + pan
- Detail-scroll mirroring
- Product video
- Reset view

</div>
<div>

### Catalogue

- Keyword search
- Category chips
- Colour explorer
- Collapsing header
- Pull-to-refresh
- Variants, media, enrichment

</div>
<div>

### Personalisation

- Session-scoped guest profile
- Top-6 scored recommendations
- Gender · personality · style hints
- Private on-phone AI talking point
- Never shown to the customer

</div>
<div>

### Commerce & admin

- Saved outfits (shortlist)
- Doubles as on-screen selector
- Checkout with pre-filled guest
- Order confirmation
- Journey logging
- CMS: CRUD, AI, analytics

</div>
</div>

<!--
Two callouts. First: saved outfits are not a shopping cart — they are the
shortlist the associate taps to switch what the guest is looking at. Second: the
AI talking point stays on the phone by design, and that restraint is the feature.
-->

---

###### Engineering

## Technology choices

| Layer | Stack | Why |
|---|---|---|
| Both apps | Flutter 3.41 / Dart 3.11, Material 3 | One codebase for phone and Android box |
| State & nav | `provider` (ChangeNotifier) + `go_router` guards | One controller per feature, DI via `MultiProvider` |
| Look | Cormorant Garamond + Inter, Material Symbols | Editorial luxury, fully tokenised — no hardcoded values |
| Realtime | `web_socket_channel`; `ws` on the server | Events, not video |
| Backend | Node 20 · Express · `better-sqlite3` · `qrcode` | Single process, single file of truth |
| CMS | Next.js 15 · React 19 · MUI 6 · Anthropic SDK · R2 | Back-office editing and AI enrichment |
| Quality | Playwright e2e (API + WS), `npm run db:check` | The contract is tested, not assumed |

<!--
The defensible choice here is Flutter for both apps: a phone and an Android TV box
from one codebase. If pressed on provider vs Riverpod, the honest answer is that
one ChangeNotifier per feature is enough at this size and easy to hand over.
-->

---

###### Deployment

## Two runtime modes, one binary

<div class="cols-2">
<div>

### Box mode · default
<p class="sub">BACKEND=false — no internet required</p>

- The display hosts HTTP + WS on `:8080`
- Its QR carries its own LAN IP + pairing token
- Both apps read a bundled 37-product snapshot
- Placeholder imagery drawn on-device (~97% of images)
- Recommendations and talking point computed locally
- Auth / checkout / customers mocked — **no persistence**

</div>
<div>

### Backend mode
<p class="sub">BACKEND=true, BACKEND_HOST=&lt;lan-ip&gt;</p>

- Catalogue, auth, customers, cart, checkout over HTTP
- Realtime relayed through the server
- Everything persists to SQLite and appears in the CMS
- Requires the Node server reachable on the LAN
- In-app **Server settings** sheet overrides the compile-time default at runtime

</div>
</div>

<!--
The trade is simple and worth stating out loud: box mode is bulletproof but
forgets; backend mode remembers but needs a host on the LAN. For a showroom demo
use box mode. For a pilot with real orders, backend mode.
-->

---

###### Run it

## From clone to live demo

```bash
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

<p class="note"><code>npm test</code> runs the Playwright API + WS suite. Both devices must be on the same WiFi for a live session.</p>

<!--
Say the one thing people get wrong: start the display first, because in box mode
it is the server. If you are demoing live, have both apps already running and the
QR on screen before this slide — then just walk to the TV.
-->

---

###### Honesty

## Known limitations

- **Box mode does not persist.** Auth, checkout and guest capture are mocked — orders never reach the CMS. Use backend mode when data must survive.
- **The Node server does not run on the Android box yet.** Node + `better-sqlite3` need Termux (fragile) or a Dart re-implementation; today backend mode needs a laptop on the LAN.
- **Some guest fields are session-scoped.** DOB, occupation, budget, brands and notes have no backend column yet — modelled for a future API.
- **~17 catalogue images are cloud URLs.** The other ~593 are on-device placeholders and work fully offline.
- **The two Flutter apps duplicate shared files.** Models, realtime and widgets are synced by hand — extraction into a package is planned.
- **`ingest/` is scaffolded but unwired.** It needs `INGEST_URL` and a source feed.

<!--
Do not soften this slide and do not skip it. Presenting the gaps unprompted is
what buys trust for everything claimed on slides 2 through 12 — and every item
here already has an owner on the roadmap slide that follows.
-->

---

###### Roadmap

## Where it goes next

<div class="cols-3">
<div>

### Near term

- On-device SQLite so box mode persists and syncs when online
- Backend columns + `PATCH /customers/:id` for the full guest profile
- Salesperson profile API — email, avatar, role
- Bundle the remaining images for a 100% offline catalogue

</div>
<div>

### Medium term

- Run the server on the box itself (Termux `node:sqlite`, or a Dart HTTP/WS server inside the display app)
- Wire `ingest/` for scheduled catalogue refresh
- Extract the duplicated Flutter foundation into a shared package
- Real AI talking points with an offline template fallback

</div>
<div>

### Longer term

- Journey replay and conversion reporting per associate
- Multi-display, multi-session per store
- Role-based access control and audit trails
- Automated widget + integration coverage for both apps

</div>
</div>

<!--
Map each near-term item back to a limitation from the previous slide — the pairing
is the argument. Longer term is where the business case lives: journey replay and
conversion reporting are what turn a showroom tool into a retail product.
-->

---

<!-- _class: lead -->

###### In one line

# The guest sees the piece. Never the phone.

*Private cockpit · editorial stage · event sync · offline by default.*

<!--
Stop talking after the headline. If there is a display in the room, this is the
moment to hand the phone to someone and let them push a product to the screen.
-->

---

<!--
SOURCES
  README.md, PROTOCOL.md, CLAUDE.md, docs/ — the application as actually built.
COMPANIONS
  docs/PPT_BRIEF.md              summary + a prompt for generating this deck elsewhere
  scripts/make_ppt.py            python-pptx generator for the same 16 slides
  docs/Fashion_Showroom_Deck.pptx  the generated deck
-->
