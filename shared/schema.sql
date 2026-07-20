-- Fashion Showcase — SQLite schema (Team B)
-- Source of truth + offline cache. The server owns this; live sessions read only from here.
-- Media lives on the box disk and is served statically; *_media/url columns hold local paths.

PRAGMA foreign_keys = ON;

-- ─── Customer capture (P1) ─────────────────────────────────────────
-- Salesperson optionally captures name + mobile at session start. Everything optional except id.
CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  mobile        TEXT,
  gender        TEXT,
  age           INTEGER,
  ageRange      TEXT,             -- onboarding choice, e.g. '25-34'
  personality   TEXT,             -- onboarding style archetype, e.g. 'Minimalist'
  currentOutfit TEXT,             -- what the guest is wearing now (optional)
  styling       TEXT,             -- how they're styling it (optional)
  wearingColor  TEXT,             -- colour the guest currently has on (optional)
  occasion      TEXT,             -- what they're shopping for (optional)
  -- Full guest profile captured by the mobile customer form. Every field optional;
  -- the associate can fill parts across multiple saves (PUT /api/customers/:id).
  dateOfBirth        TEXT,        -- ISO date string
  occupation         TEXT,
  preferredFit       TEXT,        -- Slim/Regular/Relaxed/Oversized
  topSize            TEXT,
  bottomSize         TEXT,
  shoeSize           TEXT,
  budgetRange        TEXT,        -- e.g. '₹5,000 – ₹15,000'
  notes              TEXT,        -- free-form observations
  isRepeatCustomer   INTEGER NOT NULL DEFAULT 0,
  fashionStyles      TEXT,        -- JSON array string
  favoriteColors     TEXT,        -- JSON array string
  preferredBrands    TEXT,        -- JSON array string
  favoriteCategories TEXT,        -- JSON array string
  preferredFabrics   TEXT,        -- JSON array string
  updatedAt          TEXT,        -- last profile update (PUT)
  createdAt     TEXT NOT NULL
);

-- ─── Fashion catalog ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  gender      TEXT NOT NULL DEFAULT 'unisex',   -- 'men' | 'women' | 'unisex'
  basePrice   REAL NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'INR',
  brand       TEXT,
  description TEXT,
  tags        TEXT,               -- JSON array string; drives search + P2 "show similar"
  -- AI-enrichment / recommendation attributes (authored in the CMS, feed the
  -- customer-profile recommendation match: gender + styleArchetype + ageGroup + occasion).
  heroImage      TEXT,            -- primary image URL (R2)
  subCategory    TEXT,            -- finer type: Dress/Shirt/Jeans/Sneakers/Bag…
  styleArchetype TEXT,            -- matches onboarding personality (Classic/Minimalist/…)
  occasion       TEXT,            -- Casual/Formal/Party/Work/Athleisure
  season         TEXT,            -- Summer/Winter/Spring/Autumn/All-season
  fit            TEXT,            -- Slim/Regular/Relaxed/Oversized
  pattern        TEXT,            -- Solid/Striped/Floral/Checked/Graphic
  material       TEXT,            -- primary material (broad)
  fabric         TEXT,            -- specific fabric composition
  vibe           TEXT,            -- Elegant/Edgy/Playful/Relaxed/Romantic…
  primaryColor   TEXT,
  ageGroup       TEXT,            -- Teen/Young Adult/Adult/Mature
  rating         REAL,            -- 0–5 style/quality rating
  aiEnriched     INTEGER NOT NULL DEFAULT 0,
  createdAt   TEXT NOT NULL
);

-- AI-enriched, feature-level detail authored offline, displayed in-app (P1).
CREATE TABLE IF NOT EXISTS product_enrichment (
  id        TEXT PRIMARY KEY,
  productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key       TEXT NOT NULL,
  value     TEXT,
  sortOrder INTEGER NOT NULL DEFAULT 0
);

-- Color / size variants; mediaUrl is the variant's hero image (P1 color options).
CREATE TABLE IF NOT EXISTS variants (
  id        TEXT PRIMARY KEY,
  productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size      TEXT,
  color     TEXT,
  colorHex  TEXT,
  mediaUrl  TEXT,
  stock     INTEGER NOT NULL DEFAULT 0
);

-- Related content e.g. model-wearing video, gallery images (P1 show_related).
CREATE TABLE IF NOT EXISTS product_media (
  id        TEXT PRIMARY KEY,
  productId TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type      TEXT NOT NULL,        -- "image" | "video"
  url       TEXT NOT NULL,
  posterUrl TEXT,                 -- for videos
  label     TEXT,
  sortOrder INTEGER NOT NULL DEFAULT 0
);

-- ─── Cart (server-side, per session) ───────────────────────────────
-- One cart per session; may be linked to a customer if one was captured.
CREATE TABLE IF NOT EXISTS carts (
  id         TEXT PRIMARY KEY,
  sessionId  TEXT NOT NULL UNIQUE,
  customerId TEXT REFERENCES customers(id),
  createdAt  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id        TEXT PRIMARY KEY,
  cartId    TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  productId TEXT NOT NULL REFERENCES products(id),
  variantId TEXT REFERENCES variants(id),
  quantity  INTEGER NOT NULL DEFAULT 1,
  isDefault INTEGER NOT NULL DEFAULT 0,   -- the item shown by default on the TV
  addedAt   TEXT NOT NULL
);

-- ─── Salesperson auth ──────────────────────────────────────────────
-- Credentials for the controller (mobile) app. Login gates the whole app.
-- Password is stored as scrypt hash + per-user salt (node:crypto, no external dep).
CREATE TABLE IF NOT EXISTS salespeople (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  title        TEXT,
  username     TEXT NOT NULL UNIQUE,   -- login handle (lowercased)
  passwordHash TEXT NOT NULL,
  passwordSalt TEXT NOT NULL,
  createdAt    TEXT NOT NULL
);

-- Opaque bearer tokens issued on login/register; deleted on logout.
CREATE TABLE IF NOT EXISTS auth_tokens (
  token         TEXT PRIMARY KEY,
  salespersonId TEXT NOT NULL REFERENCES salespeople(id) ON DELETE CASCADE,
  createdAt     TEXT NOT NULL
);

-- ─── Orders (checkout) ─────────────────────────────────────────────
-- Checkout snapshots the controller-side cart into a persisted order:
-- who sold it (salesperson), to whom (optional customer), and the priced lines.
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  sessionId     TEXT,
  salespersonId TEXT REFERENCES salespeople(id),
  customerId    TEXT REFERENCES customers(id),
  status        TEXT NOT NULL DEFAULT 'placed',
  itemCount     INTEGER NOT NULL DEFAULT 0,
  subtotal      REAL NOT NULL DEFAULT 0,
  discount      REAL NOT NULL DEFAULT 0,
  tax           REAL NOT NULL DEFAULT 0,
  total         REAL NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'INR',
  createdAt     TEXT NOT NULL
);

-- Priced line snapshots (name/price frozen at checkout time).
CREATE TABLE IF NOT EXISTS order_items (
  id        TEXT PRIMARY KEY,
  orderId   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  productId TEXT NOT NULL,
  variantId TEXT,
  name      TEXT,
  color     TEXT,
  size      TEXT,
  unitPrice REAL NOT NULL DEFAULT 0,
  quantity  INTEGER NOT NULL DEFAULT 1,
  lineTotal REAL NOT NULL DEFAULT 0
);

-- ─── P2: journey log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journey_events (
  id            TEXT PRIMARY KEY,
  customerId    TEXT,
  sessionId     TEXT,
  salespersonId TEXT,             -- who drove this event (records the sales journey)
  ts            TEXT NOT NULL,
  eventType     TEXT NOT NULL,    -- session_start | product_shown | cart_add | checkout | …
  refId         TEXT,             -- e.g. the productId shown
  meta          TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gender    ON products(gender);
CREATE INDEX IF NOT EXISTS idx_enrichment_product ON product_enrichment(productId);
CREATE INDEX IF NOT EXISTS idx_variants_product   ON variants(productId);
CREATE INDEX IF NOT EXISTS idx_media_product      ON product_media(productId);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart    ON cart_items(cartId);
CREATE INDEX IF NOT EXISTS idx_carts_session      ON carts(sessionId);
CREATE INDEX IF NOT EXISTS idx_journey_session    ON journey_events(sessionId);
CREATE INDEX IF NOT EXISTS idx_journey_salesperson ON journey_events(salespersonId);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_sp      ON auth_tokens(salespersonId);
CREATE INDEX IF NOT EXISTS idx_orders_session      ON orders(sessionId);
CREATE INDEX IF NOT EXISTS idx_orders_salesperson  ON orders(salespersonId);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(orderId);
