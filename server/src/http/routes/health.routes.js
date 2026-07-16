// Health + journey (P2) endpoints.
import { Router } from 'express';
import { getDb } from '../../db/index.js';
import { listEvents } from '../../repositories/journey.repo.js';

export const systemRouter = Router();

// GET /api/health
systemRouter.get('/health', (req, res) => {
  const products = getDb().prepare('SELECT COUNT(*) AS n FROM products').get().n;
  res.json({ status: 'ok', products, uptimeSec: Math.round(process.uptime()) });
});

// GET /api/journey?sessionId=&customerId=&limit=  (P2 analytics read)
systemRouter.get('/journey', (req, res) => {
  const events = listEvents({
    sessionId: req.query.sessionId,
    customerId: req.query.customerId,
    limit: Math.min(Number(req.query.limit) || 200, 1000),
  });
  res.json({ events });
});
