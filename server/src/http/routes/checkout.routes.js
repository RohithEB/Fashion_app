// Checkout endpoint: persist the controller cart as an order (salesperson-authenticated).
import { Router } from 'express';
import * as checkoutSvc from '../../services/checkout.service.js';
import { requireAuth } from '../middleware/require-auth.js';
import { logEvent } from '../../repositories/journey.repo.js';

export const checkoutRouter = Router();

// POST /api/cart/:sessionId/checkout  (Bearer token)
//   { items: [{ productId, variantId?, size?, quantity? }], customer?, customerId? }
checkoutRouter.post('/cart/:sessionId/checkout', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  const order = checkoutSvc.checkout(sessionId, {
    ...(req.body || {}),
    salespersonId: req.salesperson.id,
  });
  logEvent({
    sessionId,
    customerId: order.customerId,
    salespersonId: req.salesperson.id,
    eventType: 'checkout',
    refId: order.id,
    meta: { total: order.total, itemCount: order.itemCount },
  });
  res.status(201).json(order);
});

// GET /api/orders/:id  (Bearer token)
checkoutRouter.get('/orders/:id', requireAuth, (req, res) => {
  res.json(checkoutSvc.getOrder(req.params.id));
});
