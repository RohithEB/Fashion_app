# PROTOCOL — Fashion Showcase (Team B)

The single WebSocket contract. **Both backend (server) and frontend (display + controller) code against this.**
Frozen after Phase 0 — if it must change, announce it in the group first.

Mechanic: **the controller tells the display what to show.** The server only relays
controller↔display and owns session + idle-timeout. There is no screen mirroring.

---

## Envelope

Every message on the wire:

```json
{ "type": "string", "sessionId": "string", "payload": {} }
```

- Server relays every controller message to the paired display, and every server
  lifecycle message to both.
- The display renders whatever the controller sends. The controller never assumes
  display state.
- **Every controller command implicitly counts as `activity`** — it resets the idle timer.

---

## Base messages (session lifecycle)

| type              | direction          | payload                          | meaning |
|-------------------|--------------------|----------------------------------|---------|
| `pair`            | controller→server  | `{ pairingToken }`               | controller scanned QR, wants to bind to a display |
| `paired`          | server→both        | `{ sessionId, displayId }`       | binding confirmed; session is live |
| `activity`        | controller→server  | any                              | resets the idle timer (implicit on every command) |
| `clear`           | controller→display | `{}`                             | display returns to idle screen |
| `session_warning` | server→controller  | `{ secondsLeft }`                | "session ending soon" — idle threshold hit |
| `keep_alive`      | controller→server  | `{}`                             | user is still here; resets idle timer during grace window |
| `session_end`     | server→both        | `{ reason }`                     | session closed; display returns to idle + QR, TV free to re-pair |

Idle model: **10 min idle → `session_warning` → grace window → `session_end`.**
`keep_alive` (or any `activity`) during the grace window cancels the end.

---

## Fashion messages

| type           | direction          | payload                       | meaning |
|----------------|--------------------|-------------------------------|---------|
| `show_product` | controller→display | `{ productId, variantId? }`   | display the product detail (media + enrichment). `variantId` selects a color variant |
| `show_related` | controller→display | `{ productId, mediaId }`      | display related content — model-wearing video / alternate media |
| `clear`        | controller→display | `{}`                          | (base) back to idle |

**Cart is controller-side state.** The controller holds the shortlist; tapping a cart item
just emits `show_product`. No server message for cart.

---

## Flow (P1)

1. Display boots → idle loop + QR encoding `http://<box-ip>:PORT/controller?token=…`.
2. Controller scans QR → `pair` → server replies `paired` to both.
3. Controller: search → pick a product → `show_product` → TV shows product + AI enrichment.
4. Controller: color variant → `show_product {variantId}`; related content → `show_related`.
5. Controller cart: add products → default item auto-`show_product`; tap cart item → `show_product`.
6. Idle 10 min → `session_warning` → grace → `session_end` → display back to idle + QR.

Offline: server serves everything from the local SQLite cache + local media, so a live
session never touches the internet.
