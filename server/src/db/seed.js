// Seed a rich fashion catalog. Runs once when the products table is empty.
// Media points at the local /media/ph placeholder generator so screens render fully offline.
import { getDb } from './index.js';
import { prefixId, nowIso } from '../util/ids.js';

const APPAREL = ['XS', 'S', 'M', 'L', 'XL'];
const MEN_FOOTWEAR = ['UK6', 'UK7', 'UK8', 'UK9', 'UK10'];
const WOMEN_FOOTWEAR = ['UK3', 'UK4', 'UK5', 'UK6', 'UK7'];
const ONE_SIZE = ['One Size'];

const enrich = (obj) =>
  Object.entries(obj).map(([key, value], i) => ({ key, value, sortOrder: i }));

// Local offline placeholder image URL, rendered by the /media/ph SVG generator
// (see http/placeholder.js). Keeps seeded media fully offline: text is the label,
// bg is the variant colour (hex, no leading '#').
const img = (text, hex) =>
  `/media/ph?text=${encodeURIComponent(text)}&bg=${String(hex || '').replace(/^#/, '')}`;

// ─── Real public media (free, no API key) ──────────────────────────
// Images: loremflickr returns real photos matched to keywords (garment + colour).
// `lock` pins a stable image per URL so it doesn't change between requests.
// Video: a confirmed free stock clip (Pexels CDN) reused as the "model wearing" media,
// with a garment-matched poster image.
const MODEL_VIDEO = 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4';

// Map a product to a single garment keyword for image search.
function garmentKeyword(p) {
  const byTag = {
    dress: 'dress', skirt: 'skirt', top: 'blouse', blouse: 'blouse', shirt: 'shirt',
    't-shirt': 'tshirt', knit: 'sweater', blazer: 'blazer', coat: 'coat', jacket: 'jacket',
    trousers: 'trousers', boots: 'boots', loafer: 'loafer', derby: 'shoes', sneaker: 'sneakers',
    flats: 'ballet', sandal: 'sandals', bag: 'handbag', scarf: 'scarf', hat: 'hat', wallet: 'wallet',
  };
  const byCategory = {
    Dresses: 'dress', Tops: 'blouse', Skirts: 'skirt', Shirts: 'shirt', 'T-Shirts': 'tshirt',
    Knitwear: 'sweater', 'Jackets & Coats': 'coat', Trousers: 'trousers', Footwear: 'shoes',
    Bags: 'handbag', Accessories: 'accessory',
  };
  return byTag[p.tags?.[0]] || byCategory[p.category] || 'fashion';
}

// Nearest basic colour word from a #hex (safe, unambiguous keywords for image search).
const COLOR_WORDS = {
  black: [28, 28, 28], white: [245, 245, 240], gray: [128, 128, 128], red: [150, 20, 30],
  orange: [183, 65, 14], yellow: [225, 173, 1], green: [46, 125, 58], blue: [39, 67, 178],
  brown: [122, 75, 43], beige: [216, 195, 165], pink: [222, 165, 164], teal: [14, 76, 76],
};
function nearestColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 'gray';
  const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
  let best = 'gray', bestD = Infinity;
  for (const [name, [cr, cg, cb]] of Object.entries(COLOR_WORDS)) {
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

// A stable, garment-and-colour-matched photo URL.
const photo = (garment, colorHex, lock, { w = 800, h = 1000 } = {}) =>
  `https://loremflickr.com/${w}/${h}/${encodeURIComponent(`${garment},${nearestColor(colorHex)}`)}?lock=${lock}`;

// ─── Catalog definition ────────────────────────────────────────────
const CATALOG = [
  // ── Dresses (women) ──
  {
    name: 'Silk Charmeuse Maxi Dress', category: 'Dresses', gender: 'women', brand: 'Atelier Noir', basePrice: 24900,
    sizes: APPAREL, tags: ['dress', 'silk', 'evening', 'occasion', 'flowing'],
    description: 'Bias-cut mulberry silk maxi with a fluid drape and cowl back.',
    colors: [['Midnight', '#1F2A44'], ['Burgundy', '#6E1423'], ['Ivory', '#EDE6D6']],
    video: true,
    enrichment: {
      'AI Highlight': 'Bias-cut drape flatters every silhouette; reads luxe on camera under warm light.',
      Fabric: '100% mulberry silk charmeuse, 19 momme', Fit: 'True to size, floor-grazing 150cm length',
      Craftsmanship: 'French seams, hand-rolled hem', Care: 'Dry clean only',
      Sustainability: 'OEKO-TEX certified, traceable silk',
    },
  },
  {
    name: 'Slip Satin Dress', category: 'Dresses', gender: 'women', brand: 'Atelier Noir', basePrice: 16900,
    sizes: APPAREL, tags: ['dress', 'slip', 'satin', 'evening', 'minimal'],
    description: 'Minimal bias slip dress in fluid satin.',
    colors: [['Champagne', '#E6D3A3'], ['Black', '#1C1C1C'], ['Sapphire', '#274CB2']],
    video: true,
    enrichment: {
      'AI Highlight': 'A clean bias cut skims the body — timeless minimalism that dresses up or down.',
      Fabric: 'Satin-back crepe', Fit: 'Bias, midi length, adjustable straps',
      Craftsmanship: 'Rouleau straps, French seams', Care: 'Hand wash cold',
      Sustainability: 'GRS recycled fibres',
    },
  },
  {
    name: 'Wrap Midi Dress', category: 'Dresses', gender: 'women', brand: 'Atelier Noir', basePrice: 13900,
    sizes: APPAREL, tags: ['dress', 'wrap', 'midi', 'everyday', 'flattering'],
    description: 'True-wrap midi dress in a soft drapey crepe.',
    colors: [['Emerald', '#2E7D5B'], ['Black', '#1C1C1C'], ['Terracotta', '#B7522E']],
    video: false,
    enrichment: {
      'AI Highlight': 'The adjustable true-wrap cinches the waist and adapts to every body.',
      Fabric: 'Recycled crepe de chine', Fit: 'Wrap, self-tie waist, midi',
      Craftsmanship: 'Bound edges, interior tie', Care: 'Machine wash delicate',
      Sustainability: 'GRS recycled polyester',
    },
  },
  {
    name: 'Floral Tea Dress', category: 'Dresses', gender: 'women', brand: 'Rive', basePrice: 11900,
    sizes: APPAREL, tags: ['dress', 'floral', 'tea-dress', 'day', 'romantic'],
    description: 'Ditsy-floral tea dress with a shirred bodice and tiered skirt.',
    colors: [['Rose Print', '#C98B98'], ['Navy Print', '#2A3A5A'], ['Sage Print', '#9CAF88']],
    video: false,
    enrichment: {
      'AI Highlight': 'A shirred bodice gives a forgiving fit while the tiered skirt moves beautifully.',
      Fabric: 'LENZING ECOVERO viscose', Fit: 'Shirred bodice, midi tiers',
      Craftsmanship: 'Elasticated smocking, covered buttons', Care: 'Machine wash cold',
      Sustainability: 'ECOVERO certified viscose',
    },
  },

  // ── Tops (women) ──
  {
    name: 'Silk Camisole Top', category: 'Tops', gender: 'women', brand: 'Filo', basePrice: 7900,
    sizes: APPAREL, tags: ['top', 'silk', 'camisole', 'layering', 'evening'],
    description: 'Bias silk camisole with delicate adjustable straps.',
    colors: [['Ivory', '#EDE6D6'], ['Black', '#1C1C1C'], ['Blush', '#DEA5A4']],
    video: false,
    enrichment: {
      'AI Highlight': 'Bias-cut silk drapes softly and layers under tailoring or wears alone.',
      Fabric: '100% silk crepe de chine', Fit: 'Bias, adjustable straps',
      Craftsmanship: 'Rouleau straps, French seams', Care: 'Hand wash cold',
      Sustainability: 'OEKO-TEX certified silk',
    },
  },
  {
    name: 'Off-Shoulder Blouse', category: 'Tops', gender: 'women', brand: 'Atelier Noir', basePrice: 8900,
    sizes: APPAREL, tags: ['top', 'blouse', 'off-shoulder', 'occasion', 'statement'],
    description: 'Poplin off-shoulder blouse with volume sleeves.',
    colors: [['White', '#F5F5F0'], ['Black', '#1C1C1C'], ['Lemon', '#EBD98B']],
    video: false,
    enrichment: {
      'AI Highlight': 'An elasticated off-shoulder neckline and full sleeves frame the collarbone.',
      Fabric: 'Cotton poplin', Fit: 'Off-shoulder, volume sleeve',
      Craftsmanship: 'Shirred neckline, elasticated cuffs', Care: 'Machine wash warm',
      Sustainability: 'BCI cotton',
    },
  },
  {
    name: 'Ruched Jersey Top', category: 'Tops', gender: 'women', brand: 'Rive', basePrice: 5900,
    sizes: APPAREL, tags: ['top', 'jersey', 'ruched', 'everyday', 'fitted'],
    description: 'Fitted stretch-jersey top with side ruching.',
    colors: [['Chocolate', '#4B3621'], ['Black', '#1C1C1C'], ['Ecru', '#D6CFC0']],
    video: false,
    enrichment: {
      'AI Highlight': 'Side ruching creates a flattering line and gentle stretch moves with you.',
      Fabric: 'Modal-cotton stretch jersey', Fit: 'Fitted, long sleeve',
      Craftsmanship: 'Ruched side seams, bound neck', Care: 'Machine wash cold',
      Sustainability: 'LENZING modal',
    },
  },

  // ── Skirts (women) ──
  {
    name: 'Pleated Midi Skirt', category: 'Skirts', gender: 'women', brand: 'Atelier Noir', basePrice: 13900,
    sizes: APPAREL, tags: ['skirt', 'pleated', 'midi', 'movement', 'occasion'],
    description: 'Sunburst-pleated midi skirt with fluid movement.',
    colors: [['Champagne', '#E6D3A3'], ['Black', '#1C1C1C'], ['Sage', '#9CAF88']],
    video: true,
    enrichment: {
      'AI Highlight': 'Permanent sunburst pleats create dramatic movement that photographs beautifully.',
      Fabric: 'Recycled satin-back crepe', Fit: 'Elastic waist, midi length',
      Craftsmanship: 'Heat-set permanent pleating', Care: 'Hand wash, hang dry',
      Sustainability: 'GRS recycled polyester',
    },
  },
  {
    name: 'A-Line Denim Skirt', category: 'Skirts', gender: 'women', brand: 'Rive', basePrice: 8900,
    sizes: APPAREL, tags: ['skirt', 'denim', 'a-line', 'everyday', 'casual'],
    description: 'Rigid-denim A-line mini with a raw hem.',
    colors: [['Mid Wash', '#5A7A99'], ['Ecru', '#D6CFC0'], ['Black', '#1C1C1C']],
    video: false,
    enrichment: {
      'AI Highlight': 'Structured rigid denim holds a clean A-line and softens with wear.',
      Fabric: '100% organic cotton denim', Fit: 'High-rise, A-line mini',
      Craftsmanship: 'Raw hem, contrast topstitch', Care: 'Machine wash cold, wash less',
      Sustainability: 'Organic cotton, water-saving wash',
    },
  },
  {
    name: 'Satin Slip Skirt', category: 'Skirts', gender: 'women', brand: 'Filo', basePrice: 9900,
    sizes: APPAREL, tags: ['skirt', 'satin', 'slip', 'bias', 'evening'],
    description: 'Bias satin slip skirt with a fluid fall.',
    colors: [['Pewter', '#8B8C89'], ['Black', '#1C1C1C'], ['Bronze', '#8C6B3F']],
    video: false,
    enrichment: {
      'AI Highlight': 'A true bias cut gives the satin its liquid drape and gentle sway.',
      Fabric: 'Satin-back crepe', Fit: 'Bias, midi, elastic back',
      Craftsmanship: 'French seams, invisible zip', Care: 'Hand wash cold',
      Sustainability: 'Recycled polyester satin',
    },
  },

  // ── Shirts (men) ──
  {
    name: 'Poplin Oversized Shirt', category: 'Shirts', gender: 'men', brand: 'Rive', basePrice: 8900,
    sizes: APPAREL, tags: ['shirt', 'cotton', 'poplin', 'everyday', 'oversized'],
    description: 'Crisp cotton poplin shirt with a relaxed drop shoulder.',
    colors: [['White', '#F5F5F0'], ['Sky', '#A7C7E7'], ['Black', '#1C1C1C']],
    video: false,
    enrichment: {
      'AI Highlight': 'Crisp compact-weave poplin holds a clean line and layers effortlessly.',
      Fabric: '100% long-staple cotton poplin', Fit: 'Oversized, drop shoulder',
      Craftsmanship: 'Mother-of-pearl buttons, split yoke', Care: 'Machine wash cold, iron warm',
      Sustainability: 'BCI cotton',
    },
  },
  {
    name: 'Oxford Button-Down Shirt', category: 'Shirts', gender: 'men', brand: 'Rive', basePrice: 7900,
    sizes: APPAREL, tags: ['shirt', 'oxford', 'button-down', 'classic', 'everyday'],
    description: 'Washed Oxford-cloth button-down with a soft roll collar.',
    colors: [['White', '#F5F5F0'], ['Blue', '#8FB3D9'], ['Pink', '#E5BCC4']],
    video: false,
    enrichment: {
      'AI Highlight': 'Textured Oxford cloth is durable, breathable and softens with every wash.',
      Fabric: 'Cotton Oxford cloth', Fit: 'Regular, button-down collar',
      Craftsmanship: 'Roll collar, box pleat, locker loop', Care: 'Machine wash warm',
      Sustainability: 'BCI cotton',
    },
  },
  {
    name: 'Linen Camp Shirt', category: 'Shirts', gender: 'men', brand: 'Rive', basePrice: 7900,
    sizes: APPAREL, tags: ['shirt', 'linen', 'summer', 'camp-collar', 'breathable'],
    description: 'Breathable linen camp-collar shirt for warm days.',
    colors: [['Ecru', '#D6CFC0'], ['Terracotta', '#B7522E'], ['Slate', '#4E5A65']],
    video: false,
    enrichment: {
      'AI Highlight': 'Garment-washed European linen breathes in heat and softens with every wear.',
      Fabric: '100% European flax linen', Fit: 'Relaxed, camp collar',
      Craftsmanship: 'Garment-washed, corozo buttons', Care: 'Machine wash cold, line dry',
      Sustainability: 'European Flax certified',
    },
  },
  {
    name: 'Striped Cotton Shirt', category: 'Shirts', gender: 'men', brand: 'Maison Rive', basePrice: 8500,
    sizes: APPAREL, tags: ['shirt', 'stripe', 'cotton', 'smart-casual', 'classic'],
    description: 'Fine-stripe cotton shirt with a cutaway collar.',
    colors: [['Blue Stripe', '#5B7FA6'], ['Green Stripe', '#5E7C6B'], ['Grey Stripe', '#8A8D91']],
    video: false,
    enrichment: {
      'AI Highlight': 'A cutaway collar and fine yarn-dyed stripe read sharp under a blazer.',
      Fabric: 'Yarn-dyed cotton poplin', Fit: 'Slim, cutaway collar',
      Craftsmanship: 'Single-needle stitching', Care: 'Machine wash warm, iron',
      Sustainability: 'BCI cotton',
    },
  },

  // ── T-Shirts (men) ──
  {
    name: 'Pima Cotton Crew Tee', category: 'T-Shirts', gender: 'men', brand: 'Rive', basePrice: 3900,
    sizes: APPAREL, tags: ['t-shirt', 'pima', 'crew', 'everyday', 'essential'],
    description: 'Buttery Pima cotton crew tee with a clean neckline.',
    colors: [['White', '#F5F5F0'], ['Black', '#1C1C1C'], ['Navy', '#1F2A44'], ['Olive', '#556B2F']],
    video: false,
    enrichment: {
      'AI Highlight': 'Long-staple Pima cotton is silkier and more durable than standard jersey.',
      Fabric: '100% Peruvian Pima cotton', Fit: 'Regular crew',
      Craftsmanship: 'Ribbed collar, twin-needle hems', Care: 'Machine wash cold',
      Sustainability: 'Responsibly sourced Pima',
    },
  },
  {
    name: 'Heavyweight Boxy Tee', category: 'T-Shirts', gender: 'men', brand: 'Rive', basePrice: 4500,
    sizes: APPAREL, tags: ['t-shirt', 'heavyweight', 'boxy', 'streetwear', 'oversized'],
    description: 'Structured 240gsm boxy tee that holds its shape.',
    colors: [['Bone', '#E3DAC9'], ['Washed Black', '#2B2B2B'], ['Clay', '#9C6B4F']],
    video: false,
    enrichment: {
      'AI Highlight': 'Dense 240gsm jersey gives a premium structured drape with zero cling.',
      Fabric: '240gsm organic cotton jersey', Fit: 'Boxy, dropped shoulder',
      Craftsmanship: 'Double-stitched, ribbed neck', Care: 'Machine wash cold',
      Sustainability: 'GOTS organic cotton',
    },
  },
  {
    name: 'Breton Stripe Tee', category: 'T-Shirts', gender: 'men', brand: 'Filo', basePrice: 4200,
    sizes: APPAREL, tags: ['t-shirt', 'breton', 'stripe', 'classic', 'nautical'],
    description: 'Classic Breton-stripe long-sleeve in mid-weight cotton.',
    colors: [['Navy/Ecru', '#243B63'], ['Black/White', '#1C1C1C'], ['Red/Ecru', '#9B2D30']],
    video: false,
    enrichment: {
      'AI Highlight': 'The timeless Breton stripe is a wardrobe anchor that pairs with anything.',
      Fabric: 'Mid-weight combed cotton', Fit: 'Regular, long sleeve, boat neck',
      Craftsmanship: 'Yarn-dyed stripes, shoulder buttons', Care: 'Machine wash cold',
      Sustainability: 'BCI cotton',
    },
  },

  // ── Footwear (women) ──
  {
    name: 'Pointed Ballet Flat', category: 'Footwear', gender: 'women', brand: 'Bottega Vero', basePrice: 15900,
    sizes: WOMEN_FOOTWEAR, tags: ['flats', 'leather', 'ballet', 'classic', 'everyday'],
    description: 'Pointed leather ballet flat with a delicate ankle strap.',
    colors: [['Black', '#1C1C1C'], ['Nude', '#D6B7A0'], ['Red', '#9B2D30']],
    video: false,
    enrichment: {
      'AI Highlight': 'A pointed toe elongates the leg while the strap keeps the flat secure.',
      Fabric: 'Nappa leather, leather lining', Fit: 'True to size, cushioned footbed',
      Craftsmanship: 'Blake-stitched, leather sole', Care: 'Wipe clean, condition',
      Sustainability: 'LWG-certified tannery',
    },
  },
  {
    name: 'Block Heel Sandal', category: 'Footwear', gender: 'women', brand: 'Bottega Vero', basePrice: 18900,
    sizes: WOMEN_FOOTWEAR, tags: ['sandal', 'heel', 'leather', 'occasion', 'summer'],
    description: 'Strappy leather sandal on a walkable block heel.',
    colors: [['Tan', '#C19A6B'], ['Black', '#1C1C1C'], ['Gold', '#C9A15A']],
    video: true,
    enrichment: {
      'AI Highlight': 'A 65mm block heel gives height with all-day stability and comfort.',
      Fabric: 'Metallic and smooth leather', Fit: 'True to size, adjustable buckle',
      Craftsmanship: 'Leather-covered 65mm heel', Care: 'Store in dust bag',
      Sustainability: 'LWG-certified tannery',
    },
  },
  {
    name: 'Knee-High Leather Boot', category: 'Footwear', gender: 'women', brand: 'Bottega Vero', basePrice: 32900,
    sizes: WOMEN_FOOTWEAR, tags: ['boots', 'leather', 'knee-high', 'winter', 'statement'],
    description: 'Sleek knee-high boot in supple calf leather.',
    colors: [['Black', '#1C1C1C'], ['Chocolate', '#4B3621'], ['Burgundy', '#6E1423']],
    video: true,
    enrichment: {
      'AI Highlight': 'A close-fitting shaft and stacked heel make a sleek, elongating statement.',
      Fabric: 'Supple calf leather', Fit: 'True to size, full-length zip',
      Craftsmanship: 'Stacked 40mm heel, leather lining', Care: 'Use boot shapers',
      Sustainability: 'LWG-certified tannery',
    },
  },

  // ── Footwear (men) ──
  {
    name: 'Leather Chelsea Boot', category: 'Footwear', gender: 'men', brand: 'Bottega Vero', basePrice: 27900,
    sizes: MEN_FOOTWEAR, tags: ['boots', 'leather', 'chelsea', 'classic', 'handmade'],
    description: 'Hand-lasted Chelsea boot in polished calf leather.',
    colors: [['Black', '#1C1C1C'], ['Tan', '#C19A6B'], ['Oxblood', '#6E1423']],
    video: true,
    enrichment: {
      'AI Highlight': 'Hand-lasted calf leather and a Goodyear welt mean these can be resoled for years.',
      Fabric: 'Full-grain Italian calf leather', Fit: 'True to size, elasticated gusset',
      Craftsmanship: 'Goodyear-welted, leather sole', Care: 'Condition monthly, use shoe trees',
      Sustainability: 'LWG-certified tannery',
    },
  },
  {
    name: 'Suede Loafer', category: 'Footwear', gender: 'men', brand: 'Bottega Vero', basePrice: 19900,
    sizes: MEN_FOOTWEAR, tags: ['loafer', 'suede', 'classic', 'smart-casual', 'handmade'],
    description: 'Italian suede penny loafer with a leather sole.',
    colors: [['Tobacco', '#7A4B2B'], ['Navy', '#1F2A44'], ['Stone', '#B7B1A6']],
    video: true,
    enrichment: {
      'AI Highlight': 'Soft Italian suede over a hand-stitched apron toe — dressy yet supremely comfortable.',
      Fabric: 'Italian calf suede', Fit: 'True to size, leather lining',
      Craftsmanship: 'Blake-stitched, leather sole', Care: 'Brush and protect with suede spray',
      Sustainability: 'LWG-certified tannery',
    },
  },
  {
    name: 'Leather Derby Shoe', category: 'Footwear', gender: 'men', brand: 'Bottega Vero', basePrice: 22900,
    sizes: MEN_FOOTWEAR, tags: ['derby', 'leather', 'formal', 'classic', 'handmade'],
    description: 'Open-laced Derby in hand-polished calf leather.',
    colors: [['Black', '#1C1C1C'], ['Dark Brown', '#3B2A1E'], ['Oxblood', '#6E1423']],
    video: false,
    enrichment: {
      'AI Highlight': 'An open-lace Derby is versatile from boardroom to evening and easy to fit.',
      Fabric: 'Full-grain calf leather', Fit: 'True to size, leather lining',
      Craftsmanship: 'Goodyear-welted, leather sole', Care: 'Use shoe trees, polish regularly',
      Sustainability: 'LWG-certified tannery',
    },
  },
  {
    name: 'Canvas Low-Top Sneaker', category: 'Footwear', gender: 'men', brand: 'Rive', basePrice: 8900,
    sizes: MEN_FOOTWEAR, tags: ['sneaker', 'canvas', 'casual', 'everyday', 'minimal'],
    description: 'Clean organic-canvas low-top on a vulcanised sole.',
    colors: [['Off-White', '#EDE6D6'], ['Navy', '#1F2A44'], ['Black', '#1C1C1C']],
    video: false,
    enrichment: {
      'AI Highlight': 'A minimal vulcanised low-top goes with everything and breaks in fast.',
      Fabric: 'Organic cotton canvas', Fit: 'True to size, cotton laces',
      Craftsmanship: 'Vulcanised rubber sole', Care: 'Spot clean',
      Sustainability: 'GOTS organic cotton',
    },
  },

  // ── Jackets & Coats ──
  {
    name: 'Structured Wool Blazer', category: 'Jackets & Coats', gender: 'women', brand: 'Maison Rive', basePrice: 32900,
    sizes: APPAREL, tags: ['blazer', 'wool', 'tailored', 'workwear', 'structured'],
    description: 'Double-faced wool blazer with peak lapels and a sharp shoulder.',
    colors: [['Charcoal', '#36454F'], ['Camel', '#C19A6B'], ['Black', '#1C1C1C']],
    video: true,
    enrichment: {
      'AI Highlight': 'Sharp peak lapel and roped shoulder give an instantly tailored, elongating line.',
      Fabric: 'Double-faced Italian virgin wool', Fit: 'Tailored, slightly cropped waist',
      Craftsmanship: 'Half-canvas construction, functional cuffs', Care: 'Dry clean, steam to refresh',
      Sustainability: 'RWS-certified wool',
    },
  },
  {
    name: 'Belted Trench Coat', category: 'Jackets & Coats', gender: 'unisex', brand: 'Maison Rive', basePrice: 34900,
    sizes: APPAREL, tags: ['coat', 'trench', 'cotton', 'iconic', 'water-resistant'],
    description: 'Water-resistant cotton-gabardine trench with storm flap.',
    colors: [['Honey', '#C9A15A'], ['Black', '#1C1C1C'], ['Stone', '#B7B1A6']],
    video: true,
    enrichment: {
      'AI Highlight': 'Tightly woven gabardine sheds light rain while the belt sculpts the waist.',
      Fabric: 'Cotton gabardine, water-resistant', Fit: 'Regular, mid-calf',
      Craftsmanship: 'Storm flap, gun yoke, horn buttons', Care: 'Dry clean',
      Sustainability: 'BCI cotton',
    },
  },
  {
    name: 'Quilted Liner Jacket', category: 'Jackets & Coats', gender: 'unisex', brand: 'Rive', basePrice: 15900,
    sizes: APPAREL, tags: ['jacket', 'quilted', 'lightweight', 'layering', 'utility'],
    description: 'Diamond-quilted liner jacket, packable and warm.',
    colors: [['Olive', '#556B2F'], ['Black', '#1C1C1C'], ['Sand', '#C2B280']],
    video: false,
    enrichment: {
      'AI Highlight': 'Lightweight thermal fill packs into its own pocket — ideal transitional layering.',
      Fabric: 'Recycled nylon shell, PrimaLoft fill', Fit: 'Regular, hip length',
      Craftsmanship: 'Diamond quilting, snap placket', Care: 'Machine wash cold',
      Sustainability: 'Recycled shell and fill',
    },
  },

  // ── Knitwear ──
  {
    name: 'Cashmere Ribbed Turtleneck', category: 'Knitwear', gender: 'unisex', brand: 'Filo', basePrice: 18900,
    sizes: APPAREL, tags: ['knit', 'cashmere', 'turtleneck', 'winter', 'cosy'],
    description: 'Grade-A cashmere turtleneck in a chunky 7-gauge rib.',
    colors: [['Oatmeal', '#D8C3A5'], ['Forest', '#2F4F3E'], ['Rust', '#B7410E']],
    video: false,
    enrichment: {
      'AI Highlight': 'Grade-A long-fibre cashmere resists pilling and holds its shape season after season.',
      Fabric: '100% Grade-A Mongolian cashmere', Fit: 'Relaxed, ribbed body',
      Craftsmanship: '7-gauge fully-fashioned knit', Care: 'Hand wash cold, dry flat',
      Sustainability: 'SFA sustainable cashmere',
    },
  },
  {
    name: 'Merino Crewneck Sweater', category: 'Knitwear', gender: 'men', brand: 'Filo', basePrice: 9900,
    sizes: APPAREL, tags: ['knit', 'merino', 'crewneck', 'everyday', 'layering'],
    description: 'Fine-gauge extra-fine merino crewneck.',
    colors: [['Navy', '#1F2A44'], ['Grey Marl', '#9E9E9E'], ['Bordeaux', '#5C1A2B']],
    video: false,
    enrichment: {
      'AI Highlight': 'Extra-fine 18.5-micron merino is breathable, odour-resistant and never itchy.',
      Fabric: '100% extra-fine merino wool', Fit: 'Slim, mid-weight',
      Craftsmanship: '14-gauge knit, ribbed trims', Care: 'Machine wash wool cycle',
      Sustainability: 'Non-mulesed merino',
    },
  },

  // ── Trousers ──
  {
    name: 'High-Rise Wide Trousers', category: 'Trousers', gender: 'women', brand: 'Maison Rive', basePrice: 12900,
    sizes: APPAREL, tags: ['trousers', 'wide-leg', 'tailored', 'workwear', 'high-rise'],
    description: 'Fluid high-rise trousers with a pressed crease and wide leg.',
    colors: [['Black', '#1C1C1C'], ['Stone', '#B7B1A6'], ['Navy', '#1F2A44']],
    video: false,
    enrichment: {
      'AI Highlight': 'A high rise and pressed crease lengthen the leg for an elegant, elongated stance.',
      Fabric: 'Wool-blend suiting with 2% stretch', Fit: 'High-rise, wide leg',
      Craftsmanship: 'Hook-and-bar closure, French bearer', Care: 'Dry clean',
      Sustainability: 'Recycled polyester lining',
    },
  },
  {
    name: 'Tapered Pleated Trousers', category: 'Trousers', gender: 'men', brand: 'Maison Rive', basePrice: 11900,
    sizes: APPAREL, tags: ['trousers', 'pleated', 'tapered', 'smart-casual', 'wool'],
    description: 'Single-pleat tapered trousers in a soft wool blend.',
    colors: [['Taupe', '#8B8378'], ['Charcoal', '#36454F'], ['Cream', '#EDE6D6']],
    video: false,
    enrichment: {
      'AI Highlight': 'A single forward pleat adds room through the thigh while the taper keeps it sharp.',
      Fabric: 'Wool-blend flannel', Fit: 'Mid-rise, tapered',
      Craftsmanship: 'Single pleat, side adjusters', Care: 'Dry clean',
      Sustainability: 'Traceable wool blend',
    },
  },

  // ── Bags & Accessories ──
  {
    name: 'Structured Top-Handle Bag', category: 'Bags', gender: 'women', brand: 'Bottega Vero', basePrice: 41900,
    sizes: ONE_SIZE, tags: ['bag', 'leather', 'top-handle', 'structured', 'icon'],
    description: 'Architectural top-handle bag in grained leather with gold hardware.',
    colors: [['Black', '#1C1C1C'], ['Bone', '#E3DAC9'], ['Teal', '#0E4C4C']],
    video: true,
    enrichment: {
      'AI Highlight': 'A rigid frame keeps its sculpted shape; scales from desk to dinner.',
      Fabric: 'Grained calf leather, suede lining', Fit: '24 × 18 × 10cm, fits a tablet',
      Craftsmanship: 'Palladium hardware, hand-painted edges', Care: 'Store stuffed in dust bag',
      Sustainability: 'Traceable leather supply chain',
    },
  },
  {
    name: 'Woven Bucket Bag', category: 'Bags', gender: 'women', brand: 'Bottega Vero', basePrice: 23900,
    sizes: ONE_SIZE, tags: ['bag', 'woven', 'bucket', 'summer', 'artisan'],
    description: 'Hand-woven leather bucket bag with a drawstring closure.',
    colors: [['Natural', '#D2B48C'], ['Black', '#1C1C1C'], ['Butter', '#E8C87A']],
    video: false,
    enrichment: {
      'AI Highlight': 'Each bag is hand-woven from a single hide — no two are exactly alike.',
      Fabric: 'Nappa leather intreccio weave', Fit: '22 × 24cm, drawstring top',
      Craftsmanship: 'Hand-woven, ~10 hours per bag', Care: 'Keep dry, condition seasonally',
      Sustainability: 'Off-cut leather utilised',
    },
  },
  {
    name: 'Silk Twill Scarf', category: 'Accessories', gender: 'women', brand: 'Filo', basePrice: 6900,
    sizes: ONE_SIZE, tags: ['scarf', 'silk', 'print', 'accessory', 'gift'],
    description: '90cm silk twill scarf with a hand-drawn botanical print.',
    colors: [['Coral', '#E9967A'], ['Emerald', '#2E7D5B'], ['Cobalt', '#274CB2']],
    video: false,
    enrichment: {
      'AI Highlight': 'Hand-rolled edges and saturated screen-print colour make it a versatile statement piece.',
      Fabric: '100% silk twill', Fit: '90 × 90cm',
      Craftsmanship: 'Hand-rolled hem, 12-screen print', Care: 'Dry clean',
      Sustainability: 'Low-impact reactive dyes',
    },
  },
  {
    name: 'Leather Card Holder', category: 'Accessories', gender: 'unisex', brand: 'Bottega Vero', basePrice: 5900,
    sizes: ONE_SIZE, tags: ['wallet', 'leather', 'card-holder', 'gift', 'everyday'],
    description: 'Slim four-slot card holder in grained leather.',
    colors: [['Black', '#1C1C1C'], ['Cognac', '#9A463D'], ['Forest', '#2F4F3E']],
    video: false,
    enrichment: {
      'AI Highlight': 'Slim four-slot design carries the essentials without bulk — a perfect gift.',
      Fabric: 'Grained calf leather', Fit: '10 × 7cm, 4 slots + centre pocket',
      Craftsmanship: 'Hand-painted edges', Care: 'Keep away from moisture',
      Sustainability: 'Off-cut leather utilised',
    },
  },
  {
    name: 'Wide-Brim Wool Hat', category: 'Accessories', gender: 'women', brand: 'Filo', basePrice: 8900,
    sizes: ONE_SIZE, tags: ['hat', 'wool', 'felt', 'wide-brim', 'statement'],
    description: 'Wide-brim felt hat with a grosgrain band.',
    colors: [['Camel', '#C19A6B'], ['Black', '#1C1C1C'], ['Grey', '#808080']],
    video: false,
    enrichment: {
      'AI Highlight': 'A structured wide brim frames the face and finishes tailored looks instantly.',
      Fabric: '100% wool felt', Fit: 'Adjustable inner band',
      Craftsmanship: 'Blocked by hand, grosgrain trim', Care: 'Brush with a soft brush',
      Sustainability: 'RWS-certified wool',
    },
  },
];

// ─── Seeder ────────────────────────────────────────────────────────
export function seed() {
  const db = getDb();

  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, category, gender, basePrice, currency, brand, description, tags, createdAt)
     VALUES (@id, @name, @category, @gender, @basePrice, @currency, @brand, @description, @tags, @createdAt)`
  );
  const insertEnrichment = db.prepare(
    `INSERT INTO product_enrichment (id, productId, key, value, sortOrder)
     VALUES (@id, @productId, @key, @value, @sortOrder)`
  );
  const insertVariant = db.prepare(
    `INSERT INTO variants (id, productId, size, color, colorHex, mediaUrl, stock)
     VALUES (@id, @productId, @size, @color, @colorHex, @mediaUrl, @stock)`
  );
  const insertMedia = db.prepare(
    `INSERT INTO product_media (id, productId, type, url, posterUrl, label, sortOrder)
     VALUES (@id, @productId, @type, @url, @posterUrl, @label, @sortOrder)`
  );

  const run = db.transaction(() => {
    for (const p of CATALOG) {
      const productId = prefixId('prod');
      const createdAt = nowIso();
      insertProduct.run({
        id: productId, name: p.name, category: p.category, gender: p.gender || 'unisex',
        basePrice: p.basePrice, currency: 'INR', brand: p.brand, description: p.description,
        tags: JSON.stringify(p.tags), createdAt,
      });

      for (const e of enrich(p.enrichment)) {
        insertEnrichment.run({ id: prefixId('enr'), productId, ...e });
      }

      // (color × size) variants; mediaUrl is color-specific.
      for (const [color, hex] of p.colors) {
        const colorImg = img(`${p.name} — ${color}`, hex);
        for (const size of p.sizes) {
          insertVariant.run({
            id: prefixId('var'), productId, size, color, colorHex: hex,
            mediaUrl: colorImg, stock: 8,
          });
        }
      }

      // Media: hero + gallery images (first colours) + optional model video.
      let order = 0;
      p.colors.slice(0, 2).forEach(([color, hex]) => {
        insertMedia.run({
          id: prefixId('med'), productId, type: 'image',
          url: img(`${p.name} — ${color}`, hex),
          posterUrl: null, label: color, sortOrder: order++,
        });
      });
      if (p.video) {
        const [, hex] = p.colors[0];
        insertMedia.run({
          id: prefixId('med'), productId, type: 'video',
          url: '/media/samples/model-360.mp4',
          posterUrl: img(`${p.name} — model video`, hex),
          label: 'Model wearing', sortOrder: order++,
        });
      }
    }
  });

  run();
  return db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
}
