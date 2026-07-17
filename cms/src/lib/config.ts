import path from 'node:path';

// Resolve the shared SQLite path relative to the cms/ working dir by default.
function resolveDbPath(): string {
  const raw = process.env.DB_PATH || path.join('..', 'server', 'data', 'showcase.sqlite');
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export const config = {
  dbPath: resolveDbPath(),
  r2: {
    bucket: process.env.R2_BUCKET_NAME || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    endpoint: process.env.R2_ENDPOINT || '',
    publicUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, ''),
  },
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.AI_MODEL || 'claude-opus-4-8',
  },
};

export const r2Configured = () =>
  Boolean(config.r2.bucket && config.r2.accessKeyId && config.r2.secretAccessKey && config.r2.endpoint);

export const aiConfigured = () => Boolean(config.ai.apiKey);
