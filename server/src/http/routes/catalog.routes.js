// Catalog endpoints: list/search/sort/filter, detail, similar (P2), categories, filter meta (P2).
import { Router } from 'express';
import * as catalog from '../../services/catalog.service.js';

export const catalogRouter = Router();

// GET /api/products?q=&category=&color=&size=&minPrice=&maxPrice=&sort=&order=&limit=&offset=
catalogRouter.get('/products', (req, res) => {
  res.json(catalog.listProducts(req.query));
});

// GET /api/categories -> [{ category, count }]
catalogRouter.get('/categories', (req, res) => {
  res.json({ categories: catalog.getCategories() });
});

// GET /api/filters -> { categories, colors, sizes, priceRange }  (drives advanced filters)
catalogRouter.get('/filters', (req, res) => {
  res.json(catalog.getFilters());
});

// GET /api/products/:id -> full detail (enrichment + variants + media)
catalogRouter.get('/products/:id', (req, res) => {
  res.json(catalog.getProductDetail(req.params.id));
});

// GET /api/products/:id/similar?limit= -> cross-product "show similar" (P2)
catalogRouter.get('/products/:id/similar', (req, res) => {
  res.json(catalog.getSimilar(req.params.id, req.query.limit));
});
