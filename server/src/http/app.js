// Assemble the Express app: middleware -> static -> API routes -> error handling.
// Exported as a factory so tests can mount it without starting a listener.
import express from 'express';
import fs from 'node:fs';
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

  // Media: generated placeholders + any real files on the box disk.
  app.use('/media', placeholderRouter);
  fs.mkdirSync(config.mediaDir, { recursive: true });
  app.use('/media', express.static(config.mediaDir));

  // API surface (data channel; the WS is the command channel).
  app.use('/api', systemRouter);
  app.use('/api', authRouter);
  app.use('/api', catalogRouter);
  app.use('/api', customersRouter);
  app.use('/api', cartRouter);
  app.use('/api', checkoutRouter);
  app.use('/api', journeyRouter);
  app.use('/api', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
