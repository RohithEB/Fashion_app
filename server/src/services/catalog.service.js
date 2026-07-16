// Catalog read model: search / sort / filter, product detail, similar, filter metadata.
import * as products from '../repositories/products.repo.js';
import { notFound } from '../util/errors.js';

const parseTags = (raw) => {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
};

function toListItem(p, heroes, facets, videos) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    gender: p.gender,
    basePrice: p.basePrice,
    currency: p.currency,
    tags: parseTags(p.tags),
    heroImage: heroes[p.id] || null,
    colors: facets[p.id]?.colors || [],
    sizes: facets[p.id]?.sizes || [],
    hasVideo: !!videos[p.id],
  };
}

export function listProducts(query = {}) {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const offset = Number(query.offset) || 0;
  const { rows, total } = products.queryProducts({ ...query, limit, offset });

  const ids = rows.map((r) => r.id);
  const heroes = products.getHeroImages(ids);
  const facets = products.getVariantFacetsFor(ids);
  const videos = products.hasVideoFor(ids);

  return {
    total,
    limit,
    offset,
    items: rows.map((p) => toListItem(p, heroes, facets, videos)),
  };
}

export function getProductDetail(id) {
  const p = products.getProductById(id);
  if (!p) throw notFound('Product not found');

  const variants = products.getVariants(id);
  const colorMap = new Map();
  const sizeSet = new Set();
  for (const v of variants) {
    if (v.color) colorMap.set(v.color, v.colorHex || null);
    if (v.size) sizeSet.add(v.size);
  }
  const media = products.getMedia(id);

  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    gender: p.gender,
    basePrice: p.basePrice,
    currency: p.currency,
    description: p.description,
    tags: parseTags(p.tags),
    enrichment: products.getEnrichment(id),
    variants,
    media,
    colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
    sizes: [...sizeSet],
    heroImage: media.find((m) => m.type === 'image')?.url || variants[0]?.mediaUrl || null,
  };
}

export function getSimilar(id, limit = 8) {
  const p = products.getProductById(id);
  if (!p) throw notFound('Product not found');
  const rows = products.getSimilar(p, Number(limit) || 8);
  const ids = rows.map((r) => r.id);
  const heroes = products.getHeroImages(ids);
  const facets = products.getVariantFacetsFor(ids);
  const videos = products.hasVideoFor(ids);
  return { items: rows.map((r) => toListItem(r, heroes, facets, videos)) };
}

// Filter metadata for the controller's filter UI (P2 advanced filters).
export function getFilters() {
  return {
    categories: products.getCategories(),
    genders: products.getGenders(),
    colors: products.getDistinctColors(),
    sizes: products.getDistinctSizes(),
    priceRange: products.getPriceRange(),
  };
}

export function getCategories() {
  return products.getCategories();
}
