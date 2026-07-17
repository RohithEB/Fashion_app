import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from './config';

// The CMS opens the SAME SQLite file the showcase server owns. better-sqlite3 in
// WAL mode supports multi-process read/write, so products added here appear in the
// live catalog. The connection is cached on globalThis to survive Next HMR reloads.
type DB = Database.Database;

const g = globalThis as unknown as { __cmsDb?: DB };

export function getDb(): DB {
  if (g.__cmsDb) return g.__cmsDb;

  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  const db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  ensureSchema(db);
  g.__cmsDb = db;
  return db;
}

// Idempotent, additive: create the tables + columns the CMS relies on if a fresh
// DB is opened before the server has initialised it. Mirrors server/src/db/index.js.
function ensureSchema(db: DB) {
  const hasColumn = (table: string, col: string) =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).some((c) => c.name === col);
  const tableExists = (name: string) =>
    db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unisex', basePrice REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR', brand TEXT, description TEXT, tags TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS product_enrichment (
      id TEXT PRIMARY KEY, productId TEXT NOT NULL, key TEXT NOT NULL, value TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY, productId TEXT NOT NULL, size TEXT, color TEXT,
      colorHex TEXT, mediaUrl TEXT, stock INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS product_media (
      id TEXT PRIMARY KEY, productId TEXT NOT NULL, type TEXT NOT NULL, url TEXT NOT NULL,
      posterUrl TEXT, label TEXT, sortOrder INTEGER NOT NULL DEFAULT 0
    );
  `);

  const productCols: Array<[string, string]> = [
    ['heroImage', 'TEXT'], ['subCategory', 'TEXT'], ['styleArchetype', 'TEXT'],
    ['occasion', 'TEXT'], ['season', 'TEXT'], ['fit', 'TEXT'], ['pattern', 'TEXT'],
    ['material', 'TEXT'], ['fabric', 'TEXT'], ['vibe', 'TEXT'],
    ['primaryColor', 'TEXT'], ['ageGroup', 'TEXT'], ['rating', 'REAL'],
    ['aiEnriched', 'INTEGER NOT NULL DEFAULT 0'],
  ];
  if (tableExists('products')) {
    for (const [col, type] of productCols) {
      if (!hasColumn('products', col)) db.exec(`ALTER TABLE products ADD COLUMN ${col} ${type}`);
    }
  }

  // Salesperson attribution on the journey log (created by the server); tolerate
  // an older schema that predates the column.
  if (tableExists('journey_events') && !hasColumn('journey_events', 'salespersonId')) {
    db.exec('ALTER TABLE journey_events ADD COLUMN salespersonId TEXT');
  }
}

// Small id helper matching the server's prefixId style.
export function prefixId(prefix: string): string {
  const rand = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  return `${prefix}_${rand}`;
}

export const nowIso = () => new Date().toISOString();
