import { getDb, prefixId, nowIso } from './db';

export interface ColorVariant {
  color: string;
  colorHex?: string;
  mediaUrl?: string;
}

export interface SizeStock {
  size: string;
  quantity: number;
}

export interface ProductInput {
  name: string;
  category: string;          // coarse (Top/Bottom/Footwear/Accessory/Full-body)
  subCategory?: string;      // fine (Dress/Shirt/Jeans/…)
  gender: string;
  basePrice: number;
  currency?: string;
  brand?: string;
  description?: string;
  rating?: number;
  tags?: string[];
  heroImage?: string;
  styleArchetype?: string;
  occasion?: string;
  season?: string;
  fit?: string;
  pattern?: string;
  material?: string;
  fabric?: string;
  vibe?: string;
  primaryColor?: string;
  ageGroup?: string;
  aiEnriched?: boolean;
  highlights?: string[];         // -> product_enrichment rows
  sizes?: SizeStock[];           // size-wise quantity -> variants stock
  colors?: ColorVariant[];       // colours available -> variants
  mediaUrls?: string[];          // additional image URLs -> product_media
}

// Structured attributes surfaced as enrichment rows (rendered on the display).
const ATTR_LABELS: Array<[keyof ProductInput, string]> = [
  ['subCategory', 'Type'], ['material', 'Material'], ['fabric', 'Fabric'],
  ['fit', 'Fit'], ['pattern', 'Pattern'], ['occasion', 'Occasion'],
  ['season', 'Season'], ['vibe', 'Vibe'], ['styleArchetype', 'Style'],
  ['ageGroup', 'Age Group'], ['primaryColor', 'Colour'],
];

// Persist a product plus its enrichment, media, and variants in one transaction.
export function createProduct(input: ProductInput): string {
  const db = getDb();
  const id = prefixId('prod');
  const createdAt = nowIso();

  const insertProduct = db.prepare(`
    INSERT INTO products
      (id, name, category, subCategory, gender, basePrice, currency, brand, description, tags,
       heroImage, styleArchetype, occasion, season, fit, pattern, material, fabric, vibe,
       primaryColor, ageGroup, rating, aiEnriched, createdAt)
    VALUES
      (@id, @name, @category, @subCategory, @gender, @basePrice, @currency, @brand, @description, @tags,
       @heroImage, @styleArchetype, @occasion, @season, @fit, @pattern, @material, @fabric, @vibe,
       @primaryColor, @ageGroup, @rating, @aiEnriched, @createdAt)
  `);
  const insertEnrichment = db.prepare(
    'INSERT INTO product_enrichment (id, productId, key, value, sortOrder) VALUES (?, ?, ?, ?, ?)',
  );
  const insertMedia = db.prepare(
    'INSERT INTO product_media (id, productId, type, url, posterUrl, label, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const insertVariant = db.prepare(
    'INSERT INTO variants (id, productId, size, color, colorHex, mediaUrl, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );

  const tx = db.transaction(() => {
    insertProduct.run({
      id,
      name: input.name,
      category: input.category,
      subCategory: input.subCategory || null,
      gender: input.gender || 'unisex',
      basePrice: Number(input.basePrice) || 0,
      currency: input.currency || 'INR',
      brand: input.brand || null,
      description: input.description || null,
      tags: JSON.stringify(input.tags || []),
      heroImage: input.heroImage || null,
      styleArchetype: input.styleArchetype || null,
      occasion: input.occasion || null,
      season: input.season || null,
      fit: input.fit || null,
      pattern: input.pattern || null,
      material: input.material || null,
      fabric: input.fabric || null,
      vibe: input.vibe || null,
      primaryColor: input.primaryColor || null,
      ageGroup: input.ageGroup || null,
      rating: input.rating == null ? null : Number(input.rating),
      aiEnriched: input.aiEnriched ? 1 : 0,
      createdAt,
    });

    let order = 0;
    for (const [field, label] of ATTR_LABELS) {
      const value = input[field];
      if (value) insertEnrichment.run(prefixId('enr'), id, label, String(value), order++);
    }
    if (input.rating != null) {
      insertEnrichment.run(prefixId('enr'), id, 'Rating', `${input.rating.toFixed(1)} / 5`, order++);
    }
    for (const h of input.highlights || []) {
      if (h.trim()) insertEnrichment.run(prefixId('enr'), id, 'Highlight', h.trim(), order++);
    }

    // Media: hero first, then extras.
    let mOrder = 0;
    const images = [input.heroImage, ...(input.mediaUrls || [])].filter(Boolean) as string[];
    for (const url of images) {
      insertMedia.run(prefixId('med'), id, 'image', url, null, null, mOrder++);
    }

    // Variants: colour × size grid with per-size quantity as stock. When no colours
    // are given, fall back to a single colour so size-wise inventory is still captured.
    const sizes = input.sizes && input.sizes.length ? input.sizes : [{ size: 'One Size', quantity: 0 }];
    const colors: ColorVariant[] =
      input.colors && input.colors.length
        ? input.colors
        : [{ color: input.primaryColor || 'Default' }];
    for (const c of colors) {
      for (const s of sizes) {
        insertVariant.run(
          prefixId('var'), id, s.size, c.color, c.colorHex || null,
          c.mediaUrl || input.heroImage || null, Math.max(0, Number(s.quantity) || 0),
        );
      }
    }
  });
  tx();
  return id;
}

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  gender: string;
  basePrice: number;
  currency: string;
  brand: string | null;
  heroImage: string | null;
  styleArchetype: string | null;
  rating: number | null;
  aiEnriched: number;
  createdAt: string;
}

export function listProducts(limit = 200): ProductRow[] {
  return getDb()
    .prepare(
      `SELECT id, name, category, subCategory, gender, basePrice, currency, brand, heroImage,
              styleArchetype, rating, aiEnriched, createdAt
       FROM products ORDER BY createdAt DESC LIMIT ?`,
    )
    .all(limit) as ProductRow[];
}

export function countProducts(): number {
  return (getDb().prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }).n;
}
