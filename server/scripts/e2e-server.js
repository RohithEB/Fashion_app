// Launches the server for Playwright with a fresh, isolated DB and short idle timers
// (so the session-timeout e2e runs in seconds, not minutes). Env is set BEFORE importing
// the app so config picks it up.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'e2e.sqlite');

for (const suffix of ['', '-wal', '-shm']) {
  try { fs.rmSync(dbPath + suffix, { force: true }); } catch { /* ignore */ }
}

process.env.DB_PATH = dbPath;
process.env.PORT = process.env.E2E_PORT || '3100';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn';
process.env.IDLE_MS = process.env.IDLE_MS || '3000';   // 3s idle -> warning
process.env.GRACE_MS = process.env.GRACE_MS || '2000'; // 2s grace -> end

await import('../src/index.js');
