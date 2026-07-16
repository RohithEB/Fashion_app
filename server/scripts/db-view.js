// Quick data inspector: row counts per table + a sample product with its related rows.
// Usage: npm run db:view
import { initData } from '../src/db/bootstrap.js';
import { getDb } from '../src/db/index.js';

await initData({ ingest: false });
const db = getDb();

const TABLES = [
  'products', 'product_enrichment', 'variants', 'product_media',
  'customers', 'carts', 'cart_items', 'journey_events',
];

console.log('\n=== Row counts ===');
for (const t of TABLES) {
  const n = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  console.log(`  ${t.padEnd(20)} ${n}`);
}

const p = db.prepare('SELECT * FROM products LIMIT 1').get();
if (p) {
  console.log('\n=== Sample product ===');
  console.log(`  ${p.name} (${p.category}) — ${p.currency} ${p.basePrice}`);
  console.log('  enrichment:',
    db.prepare('SELECT key, value FROM product_enrichment WHERE productId = ?').all(p.id)
      .map((e) => e.key).join(', '));
  console.log('  variants:',
    db.prepare('SELECT COUNT(*) AS n FROM variants WHERE productId = ?').get(p.id).n, 'rows');
  console.log('  media:',
    db.prepare('SELECT type, label FROM product_media WHERE productId = ?').all(p.id)
      .map((m) => `${m.type}:${m.label}`).join(', '));
}
process.exit(0);
