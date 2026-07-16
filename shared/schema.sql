-- Fashion Showcase — SQLite schema (Team B)
-- Source of truth + offline cache. The server owns this; live sessions read only from here.
-- Media lives on the box disk and is served statically; *_media/url columns hold local paths.

PRAGMA foreign_keys = ON;

-- ─── Customer capture (P1) ─────────────────────────────────────────
-- Salesperson optionally captures name + mobile at session start. Everything optional except id.
CREATE TABLE IF NOT EXISTS customers (
  id        TEXT PRIMARY KEY,
  name      TEXT,
  mobile    TEXT,
  gender    TEXT,
  age       INTEGER,
  createdAt TEXT NOT NULL
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

-- ─── P2: journey log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journey_events (
  id         TEXT PRIMARY KEY,
  customerId TEXT,
  sessionId  TEXT,
  ts         TEXT NOT NULL,
  eventType  TEXT NOT NULL,
  refId      TEXT,
  meta       TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gender    ON products(gender);
CREATE INDEX IF NOT EXISTS idx_enrichment_product ON product_enrichment(productId);
CREATE INDEX IF NOT EXISTS idx_variants_product   ON variants(productId);
CREATE INDEX IF NOT EXISTS idx_media_product      ON product_media(productId);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart    ON cart_items(cartId);
CREATE INDEX IF NOT EXISTS idx_carts_session      ON carts(sessionId);
CREATE INDEX IF NOT EXISTS idx_journey_session    ON journey_events(sessionId);
