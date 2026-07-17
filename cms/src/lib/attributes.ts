// Controlled vocabularies for product attributes. Shared by the AI enrichment
// schema and the CMS form so both stay in lockstep — and so the recommendation
// match (customer gender + personality→styleArchetype + ageRange→ageGroup) has a
// stable set of values to compare against.

export const GENDERS = ['women', 'men', 'unisex'] as const;

// Coarse category (what part of the body / kind of item).
export const CATEGORIES = ['Top', 'Bottom', 'Footwear', 'Accessory', 'Full-body'] as const;

// Finer sub-type.
export const SUBCATEGORIES = [
  'Dress', 'Jumpsuit', 'Shirt', 'T-Shirt', 'Blouse', 'Top', 'Sweater', 'Kurta',
  'Jacket', 'Coat', 'Blazer', 'Trousers', 'Jeans', 'Skirt', 'Shorts', 'Leggings',
  'Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals', 'Loafers',
  'Bag', 'Belt', 'Scarf', 'Hat', 'Jewellery', 'Sunglasses', 'Wallet',
] as const;

// Mirrors the onboarding "personality" options captured on the controller app.
export const STYLE_ARCHETYPES = [
  'Classic', 'Minimalist', 'Trendsetter', 'Bold', 'Romantic', 'Sporty',
] as const;

export const OCCASIONS = ['Casual', 'Formal', 'Party', 'Work', 'Athleisure', 'Vacation'] as const;
export const SEASONS = ['Summer', 'Winter', 'Spring', 'Autumn', 'All-season'] as const;
export const FITS = ['Slim', 'Regular', 'Relaxed', 'Oversized', 'Tailored'] as const;
export const PATTERNS = ['Solid', 'Striped', 'Floral', 'Checked', 'Graphic', 'Printed'] as const;
export const MATERIALS = ['Cotton', 'Linen', 'Silk', 'Wool', 'Denim', 'Leather', 'Synthetic', 'Blend'] as const;
export const VIBES = ['Elegant', 'Edgy', 'Playful', 'Relaxed', 'Romantic', 'Sophisticated', 'Streetwear'] as const;
export const AGE_GROUPS = ['Teen', 'Young Adult', 'Adult', 'Mature'] as const;

export type EnrichedProduct = {
  name: string;
  category: string;      // coarse
  subCategory: string;   // fine
  gender: string;
  brand: string;
  description: string;
  basePrice: number;
  rating: number;        // 0–5
  tags: string[];
  colors: string[];      // colour names available
  sizes: string[];       // suggested size run
  styleArchetype: string;
  occasion: string;
  season: string;
  fit: string;
  pattern: string;
  material: string;
  fabric: string;        // specific composition, e.g. "100% linen"
  vibe: string;
  primaryColor: string;
  ageGroup: string;
  highlights: string[];  // short feature bullets shown on the display
};
