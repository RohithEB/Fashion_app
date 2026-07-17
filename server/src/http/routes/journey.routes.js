// Client-side clickstream logger: the controller app posts salesperson actions
// that don't pass through the WS relay (e.g. add-to-cart, opened recommendations)
// so the CMS activity log reflects the full journey. Bearer-authenticated so the
// event is always attributed to the right salesperson.
import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { logEvent } from '../../repositories/journey.repo.js';
import { badRequest } from '../../util/errors.js';

export const journeyRouter = Router();

// POST /api/journey  (Bearer token)  { eventType, sessionId?, refId?, meta? }
journeyRouter.post('/journey', requireAuth, (req, res) => {
  const { eventType, sessionId = null, refId = null, meta = null } = req.body || {};
  if (!eventType) throw badRequest('eventType is required');
  logEvent({
    salespersonId: req.salesperson.id,
    sessionId,
    refId,
    eventType: String(eventType),
    meta,
  });
  res.status(201).json({ ok: true });
});
