// One-call data bootstrap: open+migrate DB, seed on first run, optionally refresh from remote.
import { getDb, isCatalogEmpty } from './index.js';
import { seed } from './seed.js';
import { config } from '../config.js';
import { ingestFromUrl } from '../ingest/index.js';
import { logger } from '../util/logger.js';

export async function initData({ ingest = true } = {}) {
  getDb(); // open + apply schema

  if (isCatalogEmpty()) {
    const n = seed();
    logger.info(`Seeded catalog: ${n} products`);
  }

  // If a remote source is configured and reachable, refresh the cache (offline-safe: no-op if down).
  if (ingest && config.ingestUrl) {
    await ingestFromUrl(config.ingestUrl);
  }
}
