// Customer capture (P1). Name/mobile/gender/age all optional; optional sessionId links the cart.
import { Router } from 'express';
import * as customerSvc from '../../services/customer.service.js';
import { logEvent } from '../../repositories/journey.repo.js';

export const customersRouter = Router();

// POST /api/customers  { name?, mobile?, gender?, age?, sessionId? }
customersRouter.post('/customers', (req, res) => {
  const customer = customerSvc.createCustomer(req.body || {});
  logEvent({
    customerId: customer.id, sessionId: req.body?.sessionId,
    eventType: 'customer_captured', refId: customer.id,
  });
  res.status(201).json(customer);
});

// GET /api/customers/:id
customersRouter.get('/customers/:id', (req, res) => {
  res.json(customerSvc.getCustomer(req.params.id));
});
