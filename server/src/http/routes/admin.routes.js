// Admin read endpoints for the CMS running on a separate machine from the box.
// View-only: dashboard metrics, product list/detail, salespeople + journey.
// The CMS calls these when BOX_API_URL is set (see cms/src/lib/box.ts).
import fs from 'node:fs';
import path from 'node:path';
import express, { Router } from 'express';
import * as admin from '../../services/admin.service.js';
import { config } from '../../config.js';
import { notFound, badRequest } from '../../util/errors.js';
import { prefixId } from '../../util/ids.js';

export const adminRouter = Router();

const EXT = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4',
};

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

// POST /api/admin/products  (ProductInput JSON) -> { id }
// Authoring from the CMS lands on the box so the apps + display see it live.
adminRouter.post('/admin/products', (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.category) throw badRequest('name and category are required');
  const id = admin.createProduct(body);
  res.status(201).json({ id });
});

// POST /api/admin/upload?filename=&type=image|video   (raw body = file bytes)
// Saves media to the box's /media disk (served statically) so it works offline.
adminRouter.post(
  '/admin/upload',
  express.raw({ type: () => true, limit: '80mb' }),
  (req, res) => {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || !buf.length) throw badRequest('empty upload body');
    const contentType = req.get('content-type') || 'application/octet-stream';
    if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
      throw badRequest('only image/video uploads are allowed');
    }
    const ext = EXT[contentType] || (contentType.startsWith('video/') ? 'mp4' : 'bin');
    const key = `${prefixId('med')}.${ext}`;
    const dir = path.join(config.mediaDir, 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, key), buf);
    res.status(201).json({
      key: `uploads/${key}`,
      url: `/media/uploads/${key}`,
      contentType,
      size: buf.length,
    });
  },
);
