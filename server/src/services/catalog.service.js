// Catalog read model: search / sort / filter, product detail, similar, filter metadata.
import * as products from '../repositories/products.repo.js';
import * as customers from '../repositories/customers.repo.js';
import { notFound } from '../util/errors.js';

// Map the onboarding profile onto the enriched product vocabulary.
const GENDER_MAP = { female: 'women', male: 'men', women: 'women', men: 'men' };
const AGE_RANGE_TO_GROUP = {
  'Under 18': 'Teen', '18-24': 'Young Adult', '25-34': 'Young Adult',
  '35-44': 'Adult', '45-54': 'Adult', '55+': 'Mature',
};

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

// Recommendations for a customer's onboarding profile (gender + personality + age).
// Accepts an explicit profile or a customerId to look one up. Direct attribute match.
export function getRecommendations(query = {}) {
  let { gender, ageRange, personality } = query;
  if (query.customerId) {
    const c = customers.getCustomer(query.customerId);
    if (c) {
      gender = gender || c.gender;
      ageRange = ageRange || c.ageRange;
      personality = personality || c.personality;
    }
  }

  const mappedGender = GENDER_MAP[String(gender || '').toLowerCase()] || null;
  const ageGroup = query.ageGroup || AGE_RANGE_TO_GROUP[ageRange] || null;
  const limit = Math.min(Number(query.limit) || 12, 50);

  const rows = products.getRecommendations({
    gender: mappedGender, ageGroup, personality: personality || null, limit,
  });
  const ids = rows.map((r) => r.id);
  const heroes = products.getHeroImages(ids);
  const facets = products.getVariantFacetsFor(ids);
  const videos = products.hasVideoFor(ids);

  return {
    profile: { gender: mappedGender, ageGroup, personality: personality || null },
    items: rows.map((p) => ({ ...toListItem(p, heroes, facets, videos), matchScore: p.score })),
  };
}
