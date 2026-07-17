// Salesperson auth endpoints: register, login, logout, current user.
import { Router } from 'express';
import * as authSvc from '../../services/auth.service.js';
import { requireAuth } from '../middleware/require-auth.js';
import { logEvent } from '../../repositories/journey.repo.js';

export const authRouter = Router();

// POST /api/auth/register  { name, title?, username, password }
authRouter.post('/auth/register', (req, res) => {
  const result = authSvc.register(req.body || {});
  logEvent({ eventType: 'salesperson_register', refId: result.salesperson.id });
  res.status(201).json(result);
});

// POST /api/auth/login  { username, password }  -> { salesperson, token }
authRouter.post('/auth/login', (req, res) => {
  const result = authSvc.login(req.body || {});
  logEvent({ eventType: 'salesperson_login', refId: result.salesperson.id });
  res.json(result);
});

// POST /api/auth/logout  (Bearer token) -> revokes the token
authRouter.post('/auth/logout', requireAuth, (req, res) => {
  res.json(authSvc.logout(req.authToken));
});

// GET /api/auth/me  (Bearer token) -> validate a stored token on app launch
authRouter.get('/auth/me', requireAuth, (req, res) => {
  res.json({ salesperson: req.salesperson });
});
