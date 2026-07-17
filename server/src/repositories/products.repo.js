// Data access for the fashion catalog. Pure SQL; all business shaping lives in the service.
import { getDb } from '../db/index.js';

const SORT_COLUMNS = { price: 'p.basePrice', name: 'p.name', newest: 'p.createdAt' };

// Build a filtered/sorted/paged product query. Returns { rows, total }.
export function queryProducts({
  q, category, gender, color, size, minPrice, maxPrice,
  sort = 'newest', order = 'desc', limit = 50, offset = 0,
} = {}) {
  const db = getDb();
  const where = [];
  const params = {};

  if (q) {
    where.push('(p.name LIKE @q OR p.brand LIKE @q OR p.category LIKE @q OR p.tags LIKE @q OR p.description LIKE @q)');
    params.q = `%${q}%`;
  }
  if (category) { where.push('p.category = @category'); params.category = category; }
  if (gender) { where.push('p.gender = @gender'); params.gender = gender; }
  if (minPrice != null) { where.push('p.basePrice >= @minPrice'); params.minPrice = Number(minPrice); }
  if (maxPrice != null) { where.push('p.basePrice <= @maxPrice'); params.maxPrice = Number(maxPrice); }
  if (color) {
    where.push('EXISTS (SELECT 1 FROM variants v WHERE v.productId = p.id AND v.color = @color)');
    params.color = color;
  }
  if (size) {
    where.push('EXISTS (SELECT 1 FROM variants v WHERE v.productId = p.id AND v.size = @size)');
    params.size = size;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortCol = SORT_COLUMNS[sort] || SORT_COLUMNS.newest;
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM products p ${whereSql}`).get(params).n;

  const rows = db.prepare(
    `SELECT p.* FROM products p ${whereSql}
     ORDER BY ${sortCol} ${dir}, p.id ASC
     LIMIT @limit OFFSET @offset`
  ).all({ ...params, limit: Number(limit), offset: Number(offset) });

  return { rows, total };
}

export function getProductById(id) {
  return getDb().prepare('SELECT * FROM products WHERE id = ?').get(id);
}

// Attribute-scored recommendations for a customer profile. Direct keyword matching
// on the enriched columns (styleArchetype/gender/ageGroup) — no AI, offline-safe.
export function getRecommendations({ gender = null, ageGroup = null, personality = null, limit = 12 } = {}) {
  return getDb().prepare(
    `SELECT p.*,
       ( (CASE WHEN @personality IS NOT NULL AND p.styleArchetype = @personality THEN 4 ELSE 0 END)
       + (CASE WHEN @gender IS NOT NULL AND p.gender = @gender THEN 3
               WHEN p.gender = 'unisex' THEN 1 ELSE 0 END)
       + (CASE WHEN @ageGroup IS NOT NULL AND p.ageGroup = @ageGroup THEN 2 ELSE 0 END)
       ) AS score
     FROM products p
     WHERE (@gender IS NULL OR p.gender = @gender OR p.gender = 'unisex')
     ORDER BY score DESC, p.createdAt DESC
     LIMIT @limit`,
  ).all({ gender, ageGroup, personality, limit: Number(limit) || 12 });
}

export function getEnrichment(productId) {
  return getDb().prepare(
    'SELECT key, value FROM product_enrichment WHERE productId = ? ORDER BY sortOrder ASC, key ASC'
  ).all(productId);
}

export function getVariants(productId) {
  return getDb().prepare(
    'SELECT id, size, color, colorHex, mediaUrl, stock FROM variants WHERE productId = ? ORDER BY color, size'
  ).all(productId);
}

export function getMedia(productId) {
  return getDb().prepare(
    'SELECT id, type, url, posterUrl, label FROM product_media WHERE productId = ? ORDER BY sortOrder ASC'
  ).all(productId);
}

// One representative image per product for list/hero rendering.
export function getHeroImages(productIds) {
  if (!productIds.length) return {};
  const placeholders = productIds.map(() => '?').join(',');
  // SQLite bare-column rule: with MIN(sortOrder), `url` is taken from that same row.
  const rows = getDb().prepare(
    `SELECT productId, url, MIN(sortOrder) AS _m FROM product_media
     WHERE type = 'image' AND productId IN (${placeholders})
     GROUP BY productId`
  ).all(...productIds);
  return Object.fromEntries(rows.map((r) => [r.productId, r.url]));
}

// Distinct color/size lists per product (for list cards).
export function getVariantFacetsFor(productIds) {
  if (!productIds.length) return {};
  const placeholders = productIds.map(() => '?').join(',');
  const rows = getDb().prepare(
    `SELECT productId, color, colorHex, size FROM variants WHERE productId IN (${placeholders})`
  ).all(...productIds);
  const map = {};
  for (const r of rows) {
    const m = (map[r.productId] ||= { colors: new Map(), sizes: new Set() });
    if (r.color) m.colors.set(r.color, r.colorHex || null);
    if (r.size) m.sizes.add(r.size);
  }
  const out = {};
  for (const [pid, m] of Object.entries(map)) {
    out[pid] = {
      colors: [...m.colors].map(([name, hex]) => ({ name, hex })),
      sizes: [...m.sizes],
    };
  }
  return out;
}

export function hasVideoFor(productIds) {
  if (!productIds.length) return {};
  const placeholders = productIds.map(() => '?').join(',');
  const rows = getDb().prepare(
    `SELECT DISTINCT productId FROM product_media WHERE type = 'video' AND productId IN (${placeholders})`
  ).all(...productIds);
  return Object.fromEntries(rows.map((r) => [r.productId, true]));
}

// ─── Facets / filter metadata (P2 advanced filters) ────────────────
export function getCategories() {
  return getDb().prepare(
    'SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category'
  ).all();
}

export function getGenders() {
  return getDb().prepare(
    'SELECT gender, COUNT(*) AS count FROM products GROUP BY gender ORDER BY gender'
  ).all();
}

export function getDistinctColors() {
  return getDb().prepare(
    "SELECT DISTINCT color AS name, colorHex AS hex FROM variants WHERE color IS NOT NULL ORDER BY color"
  ).all();
}

export function getDistinctSizes() {
  return getDb().prepare(
    'SELECT DISTINCT size FROM variants WHERE size IS NOT NULL ORDER BY size'
  ).all().map((r) => r.size);
}

export function getPriceRange() {
  return getDb().prepare('SELECT MIN(basePrice) AS min, MAX(basePrice) AS max FROM products').get();
}

// ─── Similar (P2 cross-product) ────────────────────────────────────
// Rank by shared tags then same category, excluding the product itself.
export function getSimilar(product, limit = 8) {
  let tags = [];
  try { tags = JSON.parse(product.tags || '[]'); } catch { tags = []; }
  const candidates = getDb().prepare(
    'SELECT * FROM products WHERE id != ?'
  ).all(product.id);

  const scored = candidates.map((c) => {
    let cTags = [];
    try { cTags = JSON.parse(c.tags || '[]'); } catch { cTags = []; }
    const shared = cTags.filter((t) => tags.includes(t)).length;
    const sameCat = c.category === product.category ? 1 : 0;
    return { product: c, score: shared * 2 + sameCat };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);
}
