// Ingest/cache layer. When online and INGEST_URL is set, refresh the local catalog from a
// remote JSON source; live sessions always read from the local SQLite copy (offline-safe).
// Provide the URL later via env INGEST_URL; the expected JSON shape is documented below.
//
// Expected shape:
// {
//   "products": [
//     {
//       "id": "prod_x", "name": "...", "category": "...", "basePrice": 12900,
//       "currency": "INR", "brand": "...", "description": "...", "tags": ["..."],
//       "enrichment": [{ "key": "Fabric", "value": "..." }],
//       "variants":   [{ "size": "M", "color": "Black", "colorHex": "#111", "mediaUrl": "...", "stock": 5 }],
//       "media":      [{ "type": "image|video", "url": "...", "posterUrl": "...", "label": "..." }]
//     }
//   ]
// }
import { getDb } from '../db/index.js';
import { prefixId, nowIso } from '../util/ids.js';
import { logger } from '../util/logger.js';

export async function ingestFromUrl(url, { timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = upsertCatalog(data);
    logger.info(`Ingest complete from ${url}: ${count} products cached`);
    return { ok: true, count };
  } catch (e) {
    // Offline or unreachable -> keep the last-known-good local cache. Non-fatal by design.
    logger.warn(`Ingest skipped (${e.message}); using cached catalog`);
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

// Replace the catalog atomically with the fetched set. Cart/customer data is untouched.
export function upsertCatalog(data) {
  const db = getDb();
  const products = Array.isArray(data?.products) ? data.products : [];
  if (!products.length) return 0;

  const wipe = db.transaction(() => {
    db.exec('DELETE FROM product_media; DELETE FROM variants; DELETE FROM product_enrichment; DELETE FROM products;');
    for (const p of products) {
      const productId = p.id || prefixId('prod');
      db.prepare(
        `INSERT INTO products (id, name, category, basePrice, currency, brand, description, tags, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(productId, p.name, p.category, p.basePrice, p.currency || 'INR',
            p.brand || null, p.description || null,
            JSON.stringify(p.tags || []), p.createdAt || nowIso());

      (p.enrichment || []).forEach((e, i) =>
        db.prepare('INSERT INTO product_enrichment (id, productId, key, value, sortOrder) VALUES (?, ?, ?, ?, ?)')
          .run(prefixId('enr'), productId, e.key, e.value, e.sortOrder ?? i));

      (p.variants || []).forEach((v) =>
        db.prepare('INSERT INTO variants (id, productId, size, color, colorHex, mediaUrl, stock) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(prefixId('var'), productId, v.size || null, v.color || null,
               v.colorHex || null, v.mediaUrl || null, v.stock ?? 0));

      (p.media || []).forEach((m, i) =>
        db.prepare('INSERT INTO product_media (id, productId, type, url, posterUrl, label, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(prefixId('med'), productId, m.type, m.url, m.posterUrl || null, m.label || null, m.sortOrder ?? i));
    }
  });
  wipe();
  return products.length;
}
