import Anthropic from '@anthropic-ai/sdk';
import { config, aiConfigured } from './config';
import {
  GENDERS, CATEGORIES, SUBCATEGORIES, STYLE_ARCHETYPES, OCCASIONS, SEASONS, FITS,
  PATTERNS, MATERIALS, VIBES, AGE_GROUPS, type EnrichedProduct,
} from './attributes';

const g = globalThis as unknown as { __anthropic?: Anthropic };

function client(): Anthropic {
  if (g.__anthropic) return g.__anthropic;
  g.__anthropic = new Anthropic({ apiKey: config.ai.apiKey });
  return g.__anthropic;
}

// JSON schema for structured output — every field constrained to the controlled
// vocabularies so the result drops straight into the form and the DB columns.
const ENRICH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    category: { type: 'string', enum: [...CATEGORIES] },
    subCategory: { type: 'string', enum: [...SUBCATEGORIES] },
    gender: { type: 'string', enum: [...GENDERS] },
    brand: { type: 'string' },
    description: { type: 'string' },
    basePrice: { type: 'number' },
    rating: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
    colors: { type: 'array', items: { type: 'string' } },
    sizes: { type: 'array', items: { type: 'string' } },
    styleArchetype: { type: 'string', enum: [...STYLE_ARCHETYPES] },
    occasion: { type: 'string', enum: [...OCCASIONS] },
    season: { type: 'string', enum: [...SEASONS] },
    fit: { type: 'string', enum: [...FITS] },
    pattern: { type: 'string', enum: [...PATTERNS] },
    material: { type: 'string', enum: [...MATERIALS] },
    fabric: { type: 'string' },
    vibe: { type: 'string', enum: [...VIBES] },
    primaryColor: { type: 'string' },
    ageGroup: { type: 'string', enum: [...AGE_GROUPS] },
    highlights: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'name', 'category', 'subCategory', 'gender', 'brand', 'description', 'basePrice',
    'rating', 'tags', 'colors', 'sizes', 'styleArchetype', 'occasion', 'season',
    'fit', 'pattern', 'material', 'fabric', 'vibe', 'primaryColor', 'ageGroup', 'highlights',
  ],
} as const;

const SYSTEM = `You are a fashion merchandising expert for a luxury Indian boutique.
Analyze the garment in the image and produce complete, accurate catalog metadata.
- Write an evocative but concise product name and a 2-3 sentence description.
- "category" is the coarse type (Top/Bottom/Footwear/Accessory/Full-body); "subCategory" is the finer type.
- Estimate a realistic retail price in INR (whole number) and a quality/style "rating" from 0 to 5 (one decimal).
- "colors" = the colour names this piece plausibly comes in; "sizes" = a suitable size run (e.g. S, M, L, XL).
- "fabric" = the specific composition you can infer (e.g. "100% linen", "cotton-silk blend").
- "vibe" = the overall mood; "styleArchetype" = the customer personality this piece suits best.
- "highlights" are 3-5 short punchy feature bullets (max ~6 words each) for an in-store display.
- "tags" are 5-8 lowercase search keywords.
- Choose every enumerated field ONLY from the allowed values.
If the brand is not visible, infer a plausible boutique house name.`;

// Analyze a product image (already uploaded to R2, referenced by URL) and return
// structured, recommendation-ready product fields.
export async function enrichFromImage(imageUrl: string): Promise<EnrichedProduct> {
  if (!aiConfigured()) throw new Error('AI is not configured — set ANTHROPIC_API_KEY.');

  // `output_config` (structured outputs) can be newer than the installed SDK's
  // types, so build the params untyped and cast the response to the SDK message.
  const params = {
    model: config.ai.model,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: ENRICH_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: 'Analyze this garment and return the catalog metadata.' },
        ],
      },
    ],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = (await client().messages.create(params as any)) as Anthropic.Message;

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI returned no structured content.');
  }
  const parsed = JSON.parse(textBlock.text) as EnrichedProduct;
  // Defensive: guarantee arrays and numeric fields.
  parsed.tags = Array.isArray(parsed.tags) ? parsed.tags : [];
  parsed.colors = Array.isArray(parsed.colors) ? parsed.colors : [];
  parsed.sizes = Array.isArray(parsed.sizes) ? parsed.sizes : [];
  parsed.highlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];
  parsed.basePrice = Number(parsed.basePrice) || 0;
  parsed.rating = Math.max(0, Math.min(5, Number(parsed.rating) || 0));
  return parsed;
}
