# API Reference — Fashion Showcase Backend

Base URL: `http://<box-ip>:3000`  ·  All JSON. HTTP = data channel, WebSocket = command channel.

- **HTTP** (this doc, §1) — catalog, search, product detail, customers, cart.
- **WebSocket** (§2) — pairing, "show on TV" commands, session lifecycle. See also [PROTOCOL.md](../PROTOCOL.md).

Error shape (any 4xx/5xx): `{ "error": { "message": string, "details"?: any } }`

---

## 1. HTTP endpoints

### System
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | `{ status, products, uptimeSec }` |
| GET | `/api/journey?sessionId=&customerId=&limit=` | P2 journey events |

### Catalog
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products` | list/search/sort/filter — see query params below |
| GET | `/api/products/:id` | full detail: enrichment + variants + media |
| GET | `/api/products/:id/similar?limit=` | cross-product "show similar" (P2) |
| GET | `/api/categories` | `{ categories: [{ category, count }] }` |
| GET | `/api/filters` | `{ categories, genders, colors, sizes, priceRange }` for filter UI (P2) |

**`GET /api/products` query params** (all optional):
`q` (search name/brand/category/tags/description) · `category` · `gender` = `men|women|unisex` ·
`color` · `size` · `minPrice` · `maxPrice` · `sort` = `price|name|newest` · `order` = `asc|desc` ·
`limit` (≤100, default 50) · `offset`. Filters combine (e.g. `?gender=men&category=T-Shirts`).

Response:
```json
{
  "total": 36, "limit": 50, "offset": 0,
  "items": [{
    "id": "prod_x", "name": "Silk Charmeuse Maxi Dress", "brand": "Atelier Noir",
    "category": "Dresses", "gender": "women", "basePrice": 24900, "currency": "INR",
    "tags": ["dress","silk"], "heroImage": "/media/ph?...",
    "colors": [{ "name": "Midnight", "hex": "#1F2A44" }],
    "sizes": ["XS","S","M","L","XL"], "hasVideo": true
  }]
}
```

Catalog spans ~36 products across categories **Dresses, Tops, Skirts, Shirts, T-Shirts,
Knitwear, Jackets & Coats, Trousers, Footwear, Bags, Accessories** and genders men/women/unisex.

`GET /api/products/:id` adds `description`, `enrichment: [{key,value}]`,
`variants: [{id,size,color,colorHex,mediaUrl,stock}]`,
`media: [{id,type,url,posterUrl,label}]`, and `heroImage`.

### Customers (capture — all fields optional)
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/api/customers` | `{ name?, mobile?, gender?, age?, sessionId? }` | 201 → customer; `sessionId` links the cart |
| GET | `/api/customers/:id` | — | one customer |

### Cart (server-side, keyed by `sessionId` from pairing)
| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/api/cart/:sessionId` | — | current cart (see shape below) |
| POST | `/api/cart/:sessionId/items` | `{ productId, variantId?, quantity? }` | add / increment; first item becomes default |
| PATCH | `/api/cart/:sessionId/items/:itemId` | `{ quantity }` | set quantity; `0` removes |
| DELETE | `/api/cart/:sessionId/items/:itemId` | — | remove (promotes a new default if needed) |
| PUT | `/api/cart/:sessionId/default` | `{ itemId }` | choose which shortlisted item shows on the TV |
| DELETE | `/api/cart/:sessionId` | — | clear cart |

Cart shape:
```json
{
  "sessionId": "sess_x", "cartId": "...", "customerId": null,
  "items": [{
    "itemId": "...", "productId": "prod_x", "variantId": null,
    "quantity": 2, "isDefault": true, "unitPrice": 24900, "lineTotal": 49800,
    "product": { "id": "...", "name": "...", "brand": "...", "category": "...", "currency": "INR" },
    "variant": null
  }],
  "count": 2, "distinctItems": 1, "subtotal": 49800, "currency": "INR",
  "defaultItemId": "..."
}
```

> **Cart on the TV:** the display doesn't read the cart over HTTP — the controller drives it.
> To show a cart item, the controller emits `show_product { productId, variantId }` over WS.
> `defaultItemId` tells the controller which item to auto-show on pairing.

### Media
- `GET /media/ph?w=&h=&bg=&fg=&text=` — generated SVG placeholder (used by the seed).
- `GET /media/*` — static files from the box `media/` dir (real assets when added).

---

## 2. WebSocket  `ws://<box-ip>:3000/ws?role=display|controller`

Envelope: `{ type, sessionId, payload }`. Full contract in [PROTOCOL.md](../PROTOCOL.md).

**Display flow:** connect with `?role=display` → receive `display_registered`
`{ displayId, pairingToken, controllerUrl, qrDataUrl }` (render `qrDataUrl` as the QR).

**Controller flow:** connect with `?role=controller` → send `pair { pairingToken }` →
both receive `paired { sessionId, displayId }`.

| type | dir | payload |
|------|-----|---------|
| `display_registered` | server→display | `{ displayId, pairingToken, controllerUrl, qrDataUrl }` |
| `pair` | controller→server | `{ pairingToken }` |
| `paired` | server→both | `{ sessionId, displayId }` |
| `show_product` | controller→display | `{ productId, variantId? }` |
| `show_related` | controller→display | `{ productId, mediaId }` |
| `show_media` | controller→display | `{ mediaType, assetId }` |
| `zoom` | controller→display | `{ assetId, level, x, y }` |
| `clear` | controller→display | `{}` |
| `activity` / `keep_alive` | controller→server | `{}` (reset idle timer) |
| `session_warning` | server→controller | `{ secondsLeft }` |
| `session_end` | server→both | `{ reason }` |
| `error` | server→sender | `{ message }` |

Every controller command counts as activity (resets the idle timer). Idle model:
`IDLE_MS` (default 10 min) → `session_warning` → `GRACE_MS` (default 60s) → `session_end`,
after which the display is re-registered (fresh QR) automatically.

---

## Run

```bash
cd server
npm install
npm start          # boots, seeds on first run, serves API + WS on :3000
npm test           # Playwright: API + WS e2e (starts its own server on :3100)
```

Env overrides: `PORT`, `IDLE_MS`, `GRACE_MS`, `DB_PATH`, `MEDIA_DIR`, `INGEST_URL`, `LOG_LEVEL`.
