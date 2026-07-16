// Central config. All tunables via env with sensible defaults for the demo box.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..');

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: num(process.env.PORT, 3000),

  // Path the QR code opens on the controller device (must match the FE controller route).
  controllerPath: process.env.CONTROLLER_PATH || '/pair',

  // Session idle model: after IDLE_MS with no activity -> warning; then GRACE_MS -> end.
  idleMs: num(process.env.IDLE_MS, 10 * 60 * 1000), // 10 min
  graceMs: num(process.env.GRACE_MS, 60 * 1000),    // 1 min grace after warning

  // Filesystem
  dbPath: process.env.DB_PATH || path.join(serverRoot, 'data', 'showcase.sqlite'),
  schemaPath: path.join(repoRoot, 'shared', 'schema.sql'),
  mediaDir: process.env.MEDIA_DIR || path.join(repoRoot, 'media'),

  // Optional remote catalog to ingest when online (set later). null = seed locally only.
  ingestUrl: process.env.INGEST_URL || null,

  serverRoot,
  repoRoot,
};
