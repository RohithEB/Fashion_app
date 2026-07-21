import { Category } from '../models/category';
import { Money } from '../models/money';
import { Product, ProductMedia, ProductVariant } from '../models/product';

/// Seeded luxury catalog used for the idle advertisement loop. Ported from the
/// Flutter `MockCatalog`. Images are deterministic picsum placeholders.
const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/1200`;

const image = (seed: string) =>
  new ProductMedia({ id: `m_${seed}`, type: 'image', url: img(seed), thumbnailUrl: img(seed) });

function variant(init: {
  id: string;
  color: string;
  hex: string;
  seedBase: string;
  sizes?: string[];
}): ProductVariant {
  const { id, color, hex, seedBase, sizes = ['XS', 'S', 'M', 'L', 'XL'] } = init;
  return new ProductVariant({
    id,
    colorName: color,
    colorHex: hex,
    sizes,
    media: [
      image(`${seedBase}a`),
      image(`${seedBase}b`),
      image(`${seedBase}c`),
      new ProductMedia({
        id: `v_${seedBase}`,
        type: 'video',
        url: 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
        thumbnailUrl: img(`${seedBase}a`),
        caption: 'On the runway',
        durationSeconds: 15,
      }),
    ],
  });
}

export const MockCatalog = {
  categories: [
    new Category({ id: 'rtw', name: 'Ready-to-Wear', tagline: 'The seasonal atelier' }),
    new Category({ id: 'outerwear', name: 'Outerwear', tagline: 'Sculpted silhouettes' }),
    new Category({ id: 'leather', name: 'Leather Goods', tagline: 'Crafted to endure' }),
    new Category({ id: 'knitwear', name: 'Knitwear', tagline: 'Quiet luxury' }),
  ] as Category[],

  products: [
    new Product({
      id: 'p1',
      name: 'Silk Column Gown',
      brand: 'EBANI',
      categoryId: 'rtw',
      price: Money.fromMajor(2890),
      isNew: true,
      description:
        'A floor-grazing column in fluid silk crêpe, cut on the bias to trace the body and pool softly at the hem.',
      materials: ['100% Silk Crêpe', 'Made in Italy'],
      aiHighlights: ['Bias-cut for a liquid drape', 'Hand-finished French seams', 'Pairs with the Onyx clutch'],
      variants: [
        variant({ id: 'p1v1', color: 'Onyx', hex: '#141210', seedBase: 'gown-onyx' }),
        variant({ id: 'p1v2', color: 'Champagne', hex: '#C9A97E', seedBase: 'gown-champ' }),
        variant({ id: 'p1v3', color: 'Burgundy', hex: '#5B2130', seedBase: 'gown-bord' }),
      ],
    }),
    new Product({
      id: 'p2',
      name: 'Tailored Wool Blazer',
      brand: 'EBANI',
      categoryId: 'rtw',
      price: Money.fromMajor(1650),
      description:
        'A sharply tailored single-breasted blazer in virgin wool with a softly structured shoulder.',
      materials: ['Virgin Wool', 'Cupro Lining'],
      aiHighlights: ['Softly structured shoulder', 'Horn buttons', 'Tonal pick-stitch lapel'],
      variants: [
        variant({ id: 'p2v1', color: 'Charcoal', hex: '#37342F', seedBase: 'blazer-char' }),
        variant({ id: 'p2v2', color: 'Camel', hex: '#B79268', seedBase: 'blazer-camel' }),
      ],
    }),
    new Product({
      id: 'p3',
      name: 'Cashmere Trench',
      brand: 'EBANI',
      categoryId: 'outerwear',
      price: Money.fromMajor(3450),
      isNew: true,
      description: 'A double-faced cashmere trench with a belted waist and a fluid, unlined construction.',
      materials: ['Double-faced Cashmere'],
      aiHighlights: ['Double-faced, fully reversible', 'Belted waist', 'Weightless warmth'],
      variants: [
        variant({ id: 'p3v1', color: 'Stone', hex: '#B4ABA0', seedBase: 'trench-stone' }),
        variant({ id: 'p3v2', color: 'Ink', hex: '#1F2430', seedBase: 'trench-ink' }),
      ],
    }),
    new Product({
      id: 'p4',
      name: 'Structured Leather Tote',
      brand: 'EBANI',
      categoryId: 'leather',
      price: Money.fromMajor(1980),
      description: 'An architectural tote in full-grain calfskin with hand-burnished edges and a suede interior.',
      materials: ['Full-grain Calfskin', 'Suede Lining'],
      aiHighlights: ['Hand-burnished edges', 'Fits a 15" laptop', 'Palladium hardware'],
      variants: [
        variant({ id: 'p4v1', color: 'Cognac', hex: '#8A4B2F', seedBase: 'tote-cognac', sizes: ['One Size'] }),
        variant({ id: 'p4v2', color: 'Black', hex: '#141210', seedBase: 'tote-black', sizes: ['One Size'] }),
      ],
    }),
    new Product({
      id: 'p5',
      name: 'Ribbed Cashmere Knit',
      brand: 'EBANI',
      categoryId: 'knitwear',
      price: Money.fromMajor(890),
      description: 'A relaxed rib-knit sweater in pure Mongolian cashmere with a dropped shoulder.',
      materials: ['Pure Mongolian Cashmere'],
      aiHighlights: ['Grade-A long-fibre cashmere', 'Dropped shoulder', 'Ribbed cuffs and hem'],
      variants: [
        variant({ id: 'p5v1', color: 'Oat', hex: '#D8CDBD', seedBase: 'knit-oat' }),
        variant({ id: 'p5v2', color: 'Slate', hex: '#5C6670', seedBase: 'knit-slate' }),
        variant({ id: 'p5v3', color: 'Black', hex: '#141210', seedBase: 'knit-noir' }),
      ],
    }),
    new Product({
      id: 'p6',
      name: 'Pleated Midi Skirt',
      brand: 'EBANI',
      categoryId: 'rtw',
      price: Money.fromMajor(1120),
      description: 'A knife-pleated midi skirt in metallic-sheen satin that catches the light with every step.',
      materials: ['Satin-back Crêpe'],
      aiHighlights: ['Permanent knife pleats', 'Concealed side zip', 'Metallic sheen'],
      variants: [
        variant({ id: 'p6v1', color: 'Pewter', hex: '#8E8B84', seedBase: 'skirt-pewter' }),
        variant({ id: 'p6v2', color: 'Emerald', hex: '#1F5B4E', seedBase: 'skirt-emerald' }),
      ],
    }),
    new Product({
      id: 'p7',
      name: 'Quilted Field Jacket',
      brand: 'EBANI',
      categoryId: 'outerwear',
      price: Money.fromMajor(1390),
      description: 'A diamond-quilted field jacket with a corduroy collar and a water-repellent shell.',
      materials: ['Recycled Nylon Shell', 'Corduroy Collar'],
      aiHighlights: ['Water-repellent shell', 'Diamond quilting', 'Snap-stud placket'],
      variants: [
        variant({ id: 'p7v1', color: 'Olive', hex: '#5A5A3C', seedBase: 'field-olive' }),
        variant({ id: 'p7v2', color: 'Navy', hex: '#26303F', seedBase: 'field-navy' }),
      ],
    }),
    new Product({
      id: 'p8',
      name: 'Leather Chelsea Boot',
      brand: 'EBANI',
      categoryId: 'leather',
      price: Money.fromMajor(1240),
      description: 'A refined Chelsea boot in polished calf leather with elasticated side gussets and a leather sole.',
      materials: ['Polished Calf Leather', 'Leather Sole'],
      aiHighlights: ['Goodyear-welted', 'Elasticated gussets', 'Blake-stitched sole'],
      variants: [
        variant({ id: 'p8v1', color: 'Black', hex: '#141210', seedBase: 'boot-black', sizes: ['40', '41', '42', '43', '44'] }),
        variant({ id: 'p8v2', color: 'Chestnut', hex: '#6E4227', seedBase: 'boot-chest', sizes: ['40', '41', '42', '43', '44'] }),
      ],
    }),
  ] as Product[],
};
