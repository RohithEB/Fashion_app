// Wipe the catalog tables and re-seed from src/db/seed.js, without deleting the DB file
// (works even when a viewer holds the file open). Cart/customer/journey data is left intact.
import { getDb } from '../src/db/index.js';
import { seed } from '../src/db/seed.js';

const db = getDb();
db.exec(`
  DELETE FROM product_media;
  DELETE FROM variants;
  DELETE FROM product_enrichment;
  DELETE FROM products;
`);
const n = seed();
console.log(`Catalog reset: ${n} products seeded`);
process.exit(0);
