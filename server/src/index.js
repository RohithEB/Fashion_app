// Entry point: boot data, build the HTTP app, attach the WS server, listen.
import http from 'node:http';
import { config } from './config.js';
import { logger } from './util/logger.js';
import { lanIp } from './util/network.js';
import { initData } from './db/bootstrap.js';
import { createApp } from './http/app.js';
import { attachWs } from './ws/ws-server.js';

async function main() {
  await initData();

  const app = createApp();
  const server = http.createServer(app);
  attachWs(server);

  server.listen(config.port, config.host, () => {
    const ip = lanIp();
    logger.info('──────────────────────────────────────────────');
    logger.info(`Fashion Showcase server listening on :${config.port}`);
    logger.info(`  API      http://${ip}:${config.port}/api/health`);
    logger.info(`  WS       ws://${ip}:${config.port}/ws?role=display|controller`);
    logger.info(`  Idle     ${config.idleMs / 1000}s -> warning -> ${config.graceMs / 1000}s grace -> end`);
    logger.info('──────────────────────────────────────────────');
  });

  const shutdown = () => { logger.info('Shutting down...'); server.close(() => process.exit(0)); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => { logger.error('Fatal boot error:', e); process.exit(1); });
