// Admin read endpoints for the CMS running on a separate machine from the box.
// View-only: dashboard metrics, product list/detail, salespeople + journey.
// The CMS calls these when BOX_API_URL is set (see cms/src/lib/box.ts).
import { Router } from 'express';
import * as admin from '../../services/admin.service.js';
import { notFound } from '../../util/errors.js';

export const adminRouter = Router();

// GET /api/admin/dashboard -> DashboardMetrics
adminRouter.get('/admin/dashboard', (_req, res) => {
  res.json(admin.getDashboardMetrics());
});

// GET /api/admin/products -> { items: ProductRow[] }
adminRouter.get('/admin/products', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  res.json({ items: admin.listProducts(limit) });
});

// GET /api/admin/products/:id -> ProductDetail
adminRouter.get('/admin/products/:id', (req, res) => {
  const detail = admin.getProductDetail(req.params.id);
  if (!detail) throw notFound('Product not found');
  res.json(detail);
});

// GET /api/admin/salespeople -> { items: SalespersonRow[] }
adminRouter.get('/admin/salespeople', (_req, res) => {
  res.json({ items: admin.listSalespeople() });
});

// GET /api/admin/salespeople/:id -> SalespersonDetail
adminRouter.get('/admin/salespeople/:id', (req, res) => {
  const detail = admin.getSalesperson(req.params.id);
  if (!detail) throw notFound('Salesperson not found');
  res.json(detail);
});
