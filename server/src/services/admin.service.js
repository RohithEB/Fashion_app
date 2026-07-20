// Admin read model for the CMS running against the box (view-only).
// Ports the CMS's read queries verbatim so the returned shapes match exactly:
// dashboard metrics, product list/detail, and salespeople + journey aggregates.
import { getDb } from '../db/index.js';
import { prefixId, nowIso } from '../util/ids.js';

const tableExists = (name) =>
  Boolean(getDb().prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));

const count = (table) =>
  tableExists(table) ? getDb().prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n : 0;

// ─── Dashboard ─────────────────────────────────────────────────────
export function getDashboardMetrics() {
  const db = getDb();
  const hasOrders = tableExists('orders');

  const revenue = hasOrders
    ? db.prepare('SELECT COALESCE(SUM(total),0) AS r FROM orders').get().r
    : 0;

  const ordersByDay = hasOrders
    ? db.prepare(
        `SELECT substr(createdAt,1,10) AS date, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
         FROM orders GROUP BY date ORDER BY date DESC LIMIT 14`,
      ).all().reverse()
    : [];

  const revenueByCategory = hasOrders && tableExists('order_items')
    ? db.prepare(
        `SELECT COALESCE(p.category, 'Unknown') AS category, COALESCE(SUM(oi.lineTotal),0) AS revenue
         FROM order_items oi LEFT JOIN products p ON p.id = oi.productId
         GROUP BY category ORDER BY revenue DESC LIMIT 8`,
      ).all()
    : [];

  const ordersByStatus = hasOrders
    ? db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all()
    : [];

  const topProducts = hasOrders && tableExists('order_items')
    ? db.prepare(
        `SELECT COALESCE(name,'Item') AS name, SUM(quantity) AS quantity, SUM(lineTotal) AS revenue
         FROM order_items GROUP BY productId ORDER BY revenue DESC LIMIT 6`,
      ).all()
    : [];

  return {
    totals: {
      products: count('products'), salespeople: count('salespeople'),
      customers: count('customers'), orders: count('orders'),
    },
    revenue, currency: 'INR',
    ordersByDay, revenueByCategory, ordersByStatus, topProducts,
  };
}

// ─── Product authoring (CMS -> box) ────────────────────────────────
// Structured attributes surfaced as enrichment rows (rendered on the display).
const ATTR_LABELS = [
  ['subCategory', 'Type'], ['material', 'Material'], ['fabric', 'Fabric'],
  ['fit', 'Fit'], ['pattern', 'Pattern'], ['occasion', 'Occasion'],
  ['season', 'Season'], ['vibe', 'Vibe'], ['styleArchetype', 'Style'],
  ['ageGroup', 'Age Group'], ['primaryColor', 'Colour'],
];

// Persist a product + enrichment + media + variants in one transaction.
// Ported from the CMS so authoring lands on the box (offline-capable).
export function createProduct(input = {}) {
  const db = getDb();
  const id = prefixId('prod');
  const createdAt = nowIso();

  const insertProduct = db.prepare(`
    INSERT INTO products
      (id, name, category, subCategory, gender, basePrice, currency, brand, description, tags,
       heroImage, styleArchetype, occasion, season, fit, pattern, material, fabric, vibe,
       primaryColor, ageGroup, rating, aiEnriched, createdAt)
    VALUES
      (@id, @name, @category, @subCategory, @gender, @basePrice, @currency, @brand, @description, @tags,
       @heroImage, @styleArchetype, @occasion, @season, @fit, @pattern, @material, @fabric, @vibe,
       @primaryColor, @ageGroup, @rating, @aiEnriched, @createdAt)
  `);
  const insertEnrichment = db.prepare(
    'INSERT INTO product_enrichment (id, productId, key, value, sortOrder) VALUES (?, ?, ?, ?, ?)',
  );
  const insertMedia = db.prepare(
    'INSERT INTO product_media (id, productId, type, url, posterUrl, label, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const insertVariant = db.prepare(
    'INSERT INTO variants (id, productId, size, color, colorHex, mediaUrl, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );

  const tx = db.transaction(() => {
    insertProduct.run({
      id,
      name: input.name,
      category: input.category,
      subCategory: input.subCategory || null,
      gender: input.gender || 'unisex',
      basePrice: Number(input.basePrice) || 0,
      currency: input.currency || 'INR',
      brand: input.brand || null,
      description: input.description || null,
      tags: JSON.stringify(input.tags || []),
      heroImage: input.heroImage || null,
      styleArchetype: input.styleArchetype || null,
      occasion: input.occasion || null,
      season: input.season || null,
      fit: input.fit || null,
      pattern: input.pattern || null,
      material: input.material || null,
      fabric: input.fabric || null,
      vibe: input.vibe || null,
      primaryColor: input.primaryColor || null,
      ageGroup: input.ageGroup || null,
      rating: input.rating == null ? null : Number(input.rating),
      aiEnriched: input.aiEnriched ? 1 : 0,
      createdAt,
    });

    let order = 0;
    for (const [field, label] of ATTR_LABELS) {
      const value = input[field];
      if (value) insertEnrichment.run(prefixId('enr'), id, label, String(value), order++);
    }
    if (input.rating != null) {
      insertEnrichment.run(prefixId('enr'), id, 'Rating', `${Number(input.rating).toFixed(1)} / 5`, order++);
    }
    for (const h of input.highlights || []) {
      if (h && h.trim()) insertEnrichment.run(prefixId('enr'), id, 'Highlight', h.trim(), order++);
    }

    // Media: hero image first, then extra images, then videos (postered by the hero).
    let mOrder = 0;
    const images = [input.heroImage, ...(input.mediaUrls || [])].filter(Boolean);
    const seen = new Set();
    for (const url of images) {
      if (seen.has(url)) continue;
      seen.add(url);
      insertMedia.run(prefixId('med'), id, 'image', url, null, null, mOrder++);
    }
    for (const url of input.videoUrls || []) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      insertMedia.run(prefixId('med'), id, 'video', url, input.heroImage || null, null, mOrder++);
    }

    // Variants: colour × size grid with per-size quantity as stock.
    const sizes = input.sizes && input.sizes.length ? input.sizes : [{ size: 'One Size', quantity: 0 }];
    const colors = input.colors && input.colors.length
      ? input.colors
      : [{ color: input.primaryColor || 'Default' }];
    for (const c of colors) {
      for (const s of sizes) {
        insertVariant.run(
          prefixId('var'), id, s.size, c.color, c.colorHex || null,
          c.mediaUrl || input.heroImage || null, Math.max(0, Number(s.quantity) || 0),
        );
      }
    }
  });
  tx();
  return id;
}

// ─── Products (CMS shapes) ─────────────────────────────────────────
export function listProducts(limit = 200) {
  return getDb().prepare(
    `SELECT id, name, category, subCategory, gender, basePrice, currency, brand, heroImage,
            styleArchetype, rating, aiEnriched, createdAt
     FROM products ORDER BY createdAt DESC LIMIT ?`,
  ).all(limit);
}

export function getProductDetail(id) {
  const db = getDb();
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) return null;
  const media = db.prepare(
    'SELECT id, type, url, posterUrl, label FROM product_media WHERE productId = ? ORDER BY sortOrder',
  ).all(id);
  const variants = db.prepare(
    'SELECT id, size, color, colorHex, mediaUrl, stock FROM variants WHERE productId = ?',
  ).all(id);
  const enrichment = db.prepare(
    'SELECT key, value FROM product_enrichment WHERE productId = ? ORDER BY sortOrder',
  ).all(id);
  let tags = [];
  try { tags = JSON.parse(p.tags || '[]'); } catch { tags = []; }
  return { ...p, tags, media, variants, enrichment };
}

// ─── Salespeople + journey (CMS shapes) ────────────────────────────
export function listSalespeople() {
  if (!tableExists('salespeople')) return [];
  const hasOrders = tableExists('orders');
  const orderAgg = hasOrders
    ? `(SELECT COUNT(*) FROM orders o WHERE o.salespersonId = s.id) AS orders,
       (SELECT COUNT(DISTINCT o.customerId) FROM orders o WHERE o.salespersonId = s.id AND o.customerId IS NOT NULL) AS customers,
       (SELECT COALESCE(SUM(o.itemCount),0) FROM orders o WHERE o.salespersonId = s.id) AS itemsSold,
       (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.salespersonId = s.id) AS revenue`
    : '0 AS orders, 0 AS customers, 0 AS itemsSold, 0 AS revenue';
  return getDb().prepare(
    `SELECT s.id, s.name, s.title, s.username, s.createdAt, ${orderAgg}
     FROM salespeople s ORDER BY revenue DESC, s.createdAt DESC`,
  ).all();
}

export function getSalespersonJourney(id, limit = 500) {
  if (!tableExists('journey_events')) return [];
  return getDb().prepare(
    `SELECT je.id, je.ts, je.sessionId, je.eventType, je.refId, je.meta, p.name AS name
     FROM journey_events je LEFT JOIN products p ON p.id = je.refId
     WHERE je.salespersonId = ? ORDER BY je.ts DESC LIMIT ?`,
  ).all(id, limit);
}

function salesStrategy(id) {
  const empty = { presentations: 0, uniqueShown: 0, conversionRate: 0, topShown: [] };
  if (!tableExists('journey_events')) return empty;
  const db = getDb();
  const totals = db.prepare(
    `SELECT COUNT(*) AS presentations, COUNT(DISTINCT refId) AS uniqueShown
     FROM journey_events WHERE salespersonId = ? AND eventType = 'product_shown'`,
  ).get(id);
  const hasOrders = tableExists('orders') && tableExists('order_items');
  const orderedSub = hasOrders
    ? `(SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.orderId
         WHERE o.salespersonId = @id AND oi.productId = je.refId)`
    : '0';
  const topShown = db.prepare(
    `SELECT COALESCE(p.name, je.refId) AS name, COUNT(*) AS shown, ${orderedSub} AS ordered
     FROM journey_events je LEFT JOIN products p ON p.id = je.refId
     WHERE je.salespersonId = @id AND je.eventType = 'product_shown'
     GROUP BY je.refId ORDER BY shown DESC LIMIT 10`,
  ).all({ id });
  const converted = topShown.filter((r) => r.ordered > 0).length;
  return {
    presentations: totals.presentations, uniqueShown: totals.uniqueShown,
    conversionRate: topShown.length ? converted / topShown.length : 0, topShown,
  };
}

export function getSalesperson(id) {
  if (!tableExists('salespeople')) return null;
  const db = getDb();
  const row = listSalespeople().find((s) => s.id === id);
  if (!row) {
    const base = db.prepare('SELECT * FROM salespeople WHERE id = ?').get(id);
    if (!base) return null;
    return {
      profile: { ...base, orders: 0, customers: 0, itemsSold: 0, revenue: 0 },
      weekly: [], monthly: [], recentOrders: [],
      strategy: salesStrategy(id), journey: getSalespersonJourney(id),
    };
  }
  const hasOrders = tableExists('orders');
  const weekly = hasOrders
    ? db.prepare(
        `SELECT strftime('%Y-W%W', createdAt) AS week, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
         FROM orders WHERE salespersonId = ? GROUP BY week ORDER BY week DESC LIMIT 8`,
      ).all(id).reverse()
    : [];
  const monthly = hasOrders
    ? db.prepare(
        `SELECT substr(createdAt,1,7) AS month, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
         FROM orders WHERE salespersonId = ? GROUP BY month ORDER BY month DESC LIMIT 6`,
      ).all(id).reverse()
    : [];
  const recentOrders = hasOrders
    ? db.prepare(
        `SELECT o.id, o.total, o.itemCount, o.status, o.createdAt, c.name AS customerName
         FROM orders o LEFT JOIN customers c ON c.id = o.customerId
         WHERE o.salespersonId = ? ORDER BY o.createdAt DESC LIMIT 15`,
      ).all(id)
    : [];
  return {
    profile: row, weekly, monthly, recentOrders,
    strategy: salesStrategy(id), journey: getSalespersonJourney(id),
  };
}
