// Assemble the Express app: middleware -> static -> API routes -> error handling.
// Exported as a factory so tests can mount it without starting a listener.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { requestLogger } from './middleware/request-logger.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { placeholderRouter } from './placeholder.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { checkoutRouter } from './routes/checkout.routes.js';
import { journeyRouter } from './routes/journey.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { systemRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json());
  app.use(requestLogger);

  // Media: generated placeholders + any real files on the box disk. Long cache
  // so heavy assets (the idle model video) are fetched once and then replay from
  // the browser cache — the weak box CPU can't re-serve a 16 MB video every loop.
  app.use('/media', placeholderRouter);
  fs.mkdirSync(config.mediaDir, { recursive: true });
  app.use('/media', express.static(config.mediaDir, { maxAge: '30d', immutable: true }));

  // API surface (data channel; the WS is the command channel).
  app.use('/api', systemRouter);
  app.use('/api', authRouter);
  app.use('/api', catalogRouter);
  app.use('/api', customersRouter);
  app.use('/api', cartRouter);
  app.use('/api', checkoutRouter);
  app.use('/api', journeyRouter);
  app.use('/api', adminRouter);

  // Box-as-server web view: serve the built React Native web apps. WEB_DIR holds
  // `display/` and `controller/` (from `expo export --platform web`). The
  // controller is under /controller (built with baseUrl=/controller); the display
  // is served at the root. Static only matches real files, so /api, /ws and
  // /media still route above; unknown paths fall back to each app's index.html.
  const webRoot = process.env.WEB_DIR || path.resolve(process.cwd(), '..', 'web');
  const controllerDir = path.join(webRoot, 'controller');
  const displayDir = path.join(webRoot, 'display');
  // express.static auto-serves index.html for the mount root (/ and /controller),
  // and only matches real files, so /api, /ws and /media still route above. The
  // apps use in-memory navigation (no URL routes), so no SPA catch-all is needed.
  if (fs.existsSync(controllerDir)) {
    app.use('/controller', express.static(controllerDir));
  }
  if (fs.existsSync(displayDir)) {
    app.use(express.static(displayDir));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
