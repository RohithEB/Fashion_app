// Customer capture (P1). Name/mobile/gender/age all optional; optional sessionId links the cart.
import { Router } from 'express';
import * as customerSvc from '../../services/customer.service.js';
import { logEvent } from '../../repositories/journey.repo.js';

export const customersRouter = Router();

// GET /api/customers/options  -> onboarding choice lists (genders, ageRanges, personalities)
// Registered before /customers/:id so "options" isn't captured as an id.
customersRouter.get('/customers/options', (_req, res) => {
  res.json(customerSvc.getOnboardingOptions());
});

// POST /api/customers  { name?, mobile?, gender?, age?, ageRange?, personality?, sessionId? }
customersRouter.post('/customers', (req, res) => {
  const customer = customerSvc.createCustomer(req.body || {});
  logEvent({
    customerId: customer.id, sessionId: req.body?.sessionId,
    eventType: 'customer_captured', refId: customer.id,
  });
  res.status(201).json(customer);
});

// PUT /api/customers/:id  — partial upsert of the guest profile.
// Only the fields present in the body change, so the associate can fill the form
// across multiple saves (e.g. sizes now, colours later) without losing anything.
customersRouter.put('/customers/:id', (req, res) => {
  const customer = customerSvc.updateCustomer(req.params.id, req.body || {});
  logEvent({
    customerId: customer.id, sessionId: req.body?.sessionId,
    eventType: 'customer_updated', refId: customer.id,
  });
  res.json(customer);
});

// GET /api/customers/:id
customersRouter.get('/customers/:id', (req, res) => {
  res.json(customerSvc.getCustomer(req.params.id));
});
