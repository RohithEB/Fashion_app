// Playwright config for API + WebSocket e2e tests. No browsers needed — we use the
// `request` fixture for HTTP and the `ws` client for the socket flow.
import { defineConfig } from '@playwright/test';

const PORT = process.env.E2E_PORT || '3100';
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false, // shared server + DB; keep specs sequential
  workers: 1,
  reporter: process.env.CI ? 'line' : 'list',
  use: { baseURL },
  webServer: {
    command: 'node scripts/e2e-server.js',
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
