// SQLite connection + migration. Single shared connection (better-sqlite3 is synchronous).
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';

let db = null;

export function getDb() {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  migrate(db);                                    // additive upgrades to existing DBs
  const schema = fs.readFileSync(config.schemaPath, 'utf8');
  db.exec(schema);                                // CREATE ... IF NOT EXISTS for fresh DBs
  return db;
}

// Idempotent, additive migrations for DBs created by an earlier schema version.
// Runs before schema.exec so new indexes/columns referenced there don't fail on old tables.
function migrate(db) {
  const tableExists = (name) =>
    db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name);
  const hasColumn = (table, col) =>
    db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);

  if (tableExists('products') && !hasColumn('products', 'gender')) {
    db.exec("ALTER TABLE products ADD COLUMN gender TEXT NOT NULL DEFAULT 'unisex'");
  }

  // Onboarding fields added to an existing customers table.
  if (tableExists('customers') && !hasColumn('customers', 'ageRange')) {
    db.exec('ALTER TABLE customers ADD COLUMN ageRange TEXT');
  }
  if (tableExists('customers') && !hasColumn('customers', 'personality')) {
    db.exec('ALTER TABLE customers ADD COLUMN personality TEXT');
  }

  // Salesperson attribution added to an existing journey_events table.
  if (tableExists('journey_events') && !hasColumn('journey_events', 'salespersonId')) {
    db.exec('ALTER TABLE journey_events ADD COLUMN salespersonId TEXT');
  }

  // AI-enrichment / recommendation columns added to an existing products table.
  if (tableExists('products')) {
    const productCols = [
      ['heroImage', 'TEXT'], ['subCategory', 'TEXT'], ['styleArchetype', 'TEXT'],
      ['occasion', 'TEXT'], ['season', 'TEXT'], ['fit', 'TEXT'], ['pattern', 'TEXT'],
      ['material', 'TEXT'], ['fabric', 'TEXT'], ['vibe', 'TEXT'],
      ['primaryColor', 'TEXT'], ['ageGroup', 'TEXT'], ['rating', 'REAL'],
      ['aiEnriched', 'INTEGER NOT NULL DEFAULT 0'],
    ];
    for (const [col, type] of productCols) {
      if (!hasColumn('products', col)) {
        db.exec(`ALTER TABLE products ADD COLUMN ${col} ${type}`);
      }
    }
  }
}

// True when the catalog has never been populated — used to trigger the initial seed.
export function isCatalogEmpty() {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM products').get();
  return row.n === 0;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
