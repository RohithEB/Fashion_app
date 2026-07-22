// Catalog read model: search / sort / filter, product detail, similar, filter metadata.
import * as products from '../repositories/products.repo.js';
import * as customers from '../repositories/customers.repo.js';
import { notFound } from '../util/errors.js';
import { logger } from '../util/logger.js';

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
    // In-store placement, surfaced to the salesperson (not the display).
    storeSection: p.storeSection || null,
    storeRack: p.storeRack || null,
    storeColumn: p.storeColumn || null,
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

const lc = (s) => String(s ?? '').toLowerCase().trim();

// The mobile customer form and the CMS product attributes use different (richer)
// vocabularies. These bridge them so a guest's choice still matches the enriched
// catalog — e.g. a guest shopping for a "Wedding" matches "Formal"/"Party" pieces.
const OCCASION_SYNONYMS = {
  office: ['work', 'formal'],
  'business meeting': ['work', 'formal'],
  wedding: ['formal', 'party'],
  'date night': ['party', 'formal'],
  festival: ['party', 'casual'],
  travel: ['vacation', 'athleisure', 'casual'],
  party: ['party'],
  casual: ['casual', 'athleisure'],
};
// Guest "fashion style" -> product vibe / styleArchetype tokens.
const FASHION_STYLE_SYNONYMS = {
  'smart casual': ['sophisticated', 'classic', 'relaxed'],
  formal: ['sophisticated', 'elegant', 'classic'],
  luxury: ['elegant', 'sophisticated', 'bold'],
  streetwear: ['streetwear', 'edgy'],
  casual: ['relaxed', 'playful'],
  ethnic: ['romantic', 'elegant'],
  minimalist: ['minimalist'],
  sporty: ['sporty'],
};
const COLOR_SYNONYMS = {
  navy: ['navy', 'blue'],
  grey: ['grey', 'gray'],
  gray: ['grey', 'gray'],
  gold: ['gold', 'camel', 'beige'],
  beige: ['beige', 'camel', 'tan'],
  brown: ['brown', 'tan', 'camel'],
};

// A value plus its synonyms, as a lowercased set.
function expand(value, map) {
  const v = lc(value);
  if (!v) return new Set();
  return new Set([v, ...(map[v] || [])]);
}

// True when any guest value (expanded via `map`) equals any product value.
function anyExpandedMatch(guestVals, productVals, map) {
  const prod = productVals.filter(Boolean).map(lc);
  if (!prod.length) return false;
  return guestVals.some((gv) => {
    const set = expand(gv, map);
    return prod.some((pv) => set.has(pv));
  });
}

// Highest number in a budget band ('₹5,000 – ₹15,000' -> 15000). "Above …" = no cap.
function parseBudgetMax(band) {
  if (!band) return null;
  const s = String(band);
  if (/above/i.test(s)) return null;
  const nums = (s.match(/[\d,]+/g) || [])
    .map((n) => Number(n.replace(/,/g, '')))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return nums.length ? Math.max(...nums) : null;
}

// Resolve the effective profile from explicit query params, the persisted customer
// (via customerId), and free-text hints — query wins, then the stored profile.
function resolveProfile(query = {}) {
  const cust = query.customerId ? customers.getCustomer(query.customerId) : null;
  const pick = (k) => (query[k] != null && query[k] !== '' ? query[k] : (cust ? cust[k] : null));
  const list = (k) => {
    if (Array.isArray(query[k])) return query[k];
    if (typeof query[k] === 'string' && query[k].trim()) {
      return query[k].split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (cust && Array.isArray(cust[k])) return cust[k];
    return [];
  };
  const hintsRaw = query.hints;
  const hints = Array.isArray(hintsRaw)
    ? hintsRaw.filter(Boolean)
    : (typeof hintsRaw === 'string' ? hintsRaw.split(',').map((s) => s.trim()).filter(Boolean) : []);

  return {
    gender: GENDER_MAP[lc(pick('gender'))] || null,
    ageGroup: query.ageGroup || AGE_RANGE_TO_GROUP[pick('ageRange')] || null,
    personality: pick('personality') || null,
    occasion: pick('occasion') || null,
    preferredFit: pick('preferredFit') || null,
    favoriteColors: list('favoriteColors'),
    favoriteCategories: list('favoriteCategories'),
    preferredFabrics: list('preferredFabrics'),
    preferredBrands: list('preferredBrands'),
    fashionStyles: list('fashionStyles'),
    budgetMax: parseBudgetMax(pick('budgetRange')),
    hints,
  };
}

// Score one product against the guest profile. Deterministic, offline, weighted
// so the strongest signals (personality, occasion, category) dominate.
function scoreProduct(p, profile, facet) {
  let score = 0;
  const reasons = [];
  const add = (pts, label) => { score += pts; reasons.push(label); };
  const has = (arr, val) => !!val && arr.some((x) => lc(x) === lc(val));

  if (profile.gender && p.gender === profile.gender) add(3, 'gender');
  else if (p.gender === 'unisex') add(1, 'versatile');
  if (profile.ageGroup && lc(p.ageGroup) === lc(profile.ageGroup)) add(2, 'age group');
  if (profile.personality && lc(p.styleArchetype) === lc(profile.personality)) add(4, 'style personality');
  if (profile.occasion && expand(profile.occasion, OCCASION_SYNONYMS).has(lc(p.occasion))) add(3, 'occasion');
  if (profile.preferredFit && lc(p.fit) === lc(profile.preferredFit)) add(2, 'fit');

  if (profile.favoriteColors.length) {
    const variantColors = (facet?.colors || []).map((c) => c.name);
    if (anyExpandedMatch(profile.favoriteColors, [p.primaryColor, ...variantColors], COLOR_SYNONYMS)) add(2, 'colour');
  }
  if (profile.favoriteCategories.length && (has(profile.favoriteCategories, p.category) || has(profile.favoriteCategories, p.subCategory))) add(3, 'category');
  if (profile.preferredFabrics.length && (has(profile.preferredFabrics, p.fabric) || has(profile.preferredFabrics, p.material))) add(2, 'fabric');
  if (profile.preferredBrands.length && has(profile.preferredBrands, p.brand)) add(3, 'brand');
  if (profile.fashionStyles.length) {
    const tags = parseTags(p.tags);
    if (anyExpandedMatch(profile.fashionStyles, [p.vibe, p.styleArchetype, ...tags], FASHION_STYLE_SYNONYMS)) add(2, 'fashion style');
  }
  if (profile.budgetMax != null && Number(p.basePrice) <= profile.budgetMax) add(1, 'within budget');
  if (profile.hints.length) {
    const hay = [p.styleArchetype, p.occasion, p.fit, p.vibe, p.primaryColor, p.category, p.subCategory, p.fabric, p.material, p.brand, ...parseTags(p.tags)];
    const matched = profile.hints.filter((h) => hay.some((v) => lc(v) === lc(h))).length;
    if (matched) add(Math.min(matched, 3), 'preferences');
  }
  return { score, reasons };
}

// Recommendations for a customer's full profile. Accepts explicit query params,
// a customerId to load the stored profile, and/or free-text `hints`. Products are
// scored across every captured signal; a fuller profile yields sharper picks.
export function getRecommendations(query = {}) {
  const profile = resolveProfile(query);
  const limit = Math.min(Number(query.limit) || 12, 50);

  const all = products.queryProducts({ limit: 1000, offset: 0 }).rows;
  // A guest's gender is a hard constraint — never recommend womenswear to a man
  // because the colour/style happened to match. Unisex always stays eligible.
  const pool = profile.gender
    ? all.filter((p) => p.gender === profile.gender || p.gender === 'unisex')
    : all;
  const facets = products.getVariantFacetsFor(pool.map((p) => p.id));

  const scored = pool
    .map((p) => ({ p, ...scoreProduct(p, profile, facets[p.id]) }))
    .sort((a, b) => b.score - a.score || (b.p.createdAt > a.p.createdAt ? 1 : -1));

  const positive = scored.filter((s) => s.score > 0);
  // Fall back to newest when nothing matched, so the screen is never empty.
  const picks = (positive.length ? positive : scored).slice(0, limit);

  const ids = picks.map((s) => s.p.id);
  const heroes = products.getHeroImages(ids);
  const videos = products.hasVideoFor(ids);

  const signals = [
    profile.gender, profile.ageGroup, profile.personality, profile.occasion,
    profile.preferredFit,
    ...profile.favoriteColors, ...profile.favoriteCategories,
    ...profile.preferredFabrics, ...profile.preferredBrands, ...profile.fashionStyles,
    profile.budgetMax ? `≤${profile.budgetMax}` : null,
  ].filter(Boolean);
  logger.info(
    `[recommendations] ${query.customerId ? `customer=${query.customerId}` : 'profile'} ` +
    `signals=[${signals.join(',')}] -> ${picks.length} picks` +
    `${picks[0] ? ` top="${picks[0].p.name}"(score=${picks[0].score})` : ''}`,
  );

  return {
    profile,
    items: picks.map((s) => ({
      ...toListItem(s.p, heroes, facets, videos),
      matchScore: s.score,
      matchReasons: s.reasons,
    })),
  };
}

// A PRIVATE, on-phone talking point for the associate — a warm, specific line to
// SAY to the guest, composed from the product's AI enrichment (highlight, fabric,
// fit) + the guest profile. Deterministic (no external call) so it is instant and
// demo-safe. Never shown on the customer display; strictly a coaching cue.
export function getTalkingPoint(query = {}) {
  const productId = query.productId;
  const p = productId ? products.getProductById(productId) : null;
  if (!p) throw notFound('Product not found');

  let { personality, name } = query;
  if (query.customerId) {
    const c = customers.getCustomer(query.customerId);
    if (c) { personality = personality || c.personality; name = name || c.name; }
  }

  const byKey = {};
  for (const e of products.getEnrichment(productId)) {
    byKey[String(e.key || '').toLowerCase()] = e.value;
  }
  const highlight = byKey['ai highlight'] || byKey['highlight'] || p.description || '';
  const fabric = byKey['fabric'];
  const fit = byKey['fit'];

  const who = (name && name.trim()) ? name.trim() : null;
  const persona = (personality && personality.trim())
    ? personality.trim().toLowerCase() : null;

  const detail = (fabric && fit)
    ? `the ${fabric.toLowerCase()} and how the ${fit.toLowerCase()} cut will sit on them`
    : fabric ? `the ${fabric.toLowerCase()}`
    : fit ? `how the ${fit.toLowerCase()} cut will sit on them`
    : 'the hand-finished detailing';

  const lead = who
    ? `${who}, the ${p.name} feels like it was made for you`
    : `The ${p.name} suits you beautifully`;
  const personaClause = persona
    ? ` — exactly the kind of piece a ${persona} eye gravitates to`
    : '';
  const hl = highlight
    ? ` ${highlight.charAt(0).toUpperCase()}${highlight.slice(1).replace(/\.+$/, '')}.`
    : '';

  const compliment = `Say this: “${lead}${personaClause}.”${hl} Then point out ${detail}.`;
  return { productId, compliment };
}
