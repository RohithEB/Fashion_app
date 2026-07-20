// Export a full offline catalogue snapshot from the running backend into both
// Flutter apps' assets, for box-as-server / offline mode.
//
// The snapshot is an array of `/api/products/:id` detail objects — exactly the
// shape `BackendDto.fromDetail` already parses — so offline parsing reuses the
// same mapper as backend mode.
//
// Usage:  node scripts/export-catalog.mjs        (backend must be on :3000)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BACKEND_URL || 'http://localhost:3000';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = [
  resolve(root, 'frontend/mobile_app/assets/catalog_snapshot.json'),
  resolve(root, 'frontend/display_app/assets/catalog_snapshot.json'),
];

const json = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

const list = await json(`${BASE}/api/products?limit=500`);
const items = list.items || [];
console.log(`list: ${items.length} products`);

const products = [];
for (const item of items) {
  try {
    products.push(await json(`${BASE}/api/products/${item.id}`));
  } catch (e) {
    console.warn(`skip ${item.id}: ${e.message}`);
  }
}

const filters = await json(`${BASE}/api/filters`).catch(() => ({}));
const text = JSON.stringify({
  exportedAt: new Date().toISOString(),
  count: products.length,
  filters,
  products,
});

for (const path of OUT) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  console.log(`wrote ${path} (${(text.length / 1024).toFixed(1)} KB)`);
}
console.log('Done — rebuild both Flutter apps to bundle the new snapshot.');
