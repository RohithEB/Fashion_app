// Cart endpoints (server-side, per session): get, add, change quantity, remove, set default, clear.
import { Router } from 'express';
import * as cartSvc from '../../services/cart.service.js';
import { logEvent } from '../../repositories/journey.repo.js';

export const cartRouter = Router();

// GET /api/cart/:sessionId
cartRouter.get('/cart/:sessionId', (req, res) => {
  res.json(cartSvc.getCart(req.params.sessionId));
});

// POST /api/cart/:sessionId/items  { productId, variantId?, quantity? }
cartRouter.post('/cart/:sessionId/items', (req, res) => {
  const { sessionId } = req.params;
  const cart = cartSvc.addItem(sessionId, req.body || {});
  logEvent({ sessionId, eventType: 'cart_add', refId: req.body?.productId, meta: req.body });
  res.status(201).json(cart);
});

// PATCH /api/cart/:sessionId/items/:itemId  { quantity }
cartRouter.patch('/cart/:sessionId/items/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;
  const cart = cartSvc.updateQuantity(sessionId, itemId, req.body?.quantity);
  logEvent({ sessionId, eventType: 'cart_qty', refId: itemId, meta: { quantity: req.body?.quantity } });
  res.json(cart);
});

// DELETE /api/cart/:sessionId/items/:itemId
cartRouter.delete('/cart/:sessionId/items/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;
  const cart = cartSvc.removeItem(sessionId, itemId);
  logEvent({ sessionId, eventType: 'cart_remove', refId: itemId });
  res.json(cart);
});

// PUT /api/cart/:sessionId/default  { itemId }  -> which shortlisted item shows by default
cartRouter.put('/cart/:sessionId/default', (req, res) => {
  const { sessionId } = req.params;
  const cart = cartSvc.setDefaultItem(sessionId, req.body?.itemId);
  logEvent({ sessionId, eventType: 'cart_default', refId: req.body?.itemId });
  res.json(cart);
});

// DELETE /api/cart/:sessionId  -> clear the whole cart
cartRouter.delete('/cart/:sessionId', (req, res) => {
  res.json(cartSvc.clearCart(req.params.sessionId));
});
