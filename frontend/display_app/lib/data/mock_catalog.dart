import '../models/category.dart';
import '../models/money.dart';
import '../models/product.dart';

/// Seeded luxury catalog used until the backend clothes API is available.
///
/// Images are deterministic placeholders (picsum). AI enrichment fields
/// (`aiHighlights`) simulate the pre-generated data the catalog API will serve.
/// Swapping to the real API means replacing [MockCatalog] behind
/// `CatalogRepository` — no UI changes required.
abstract final class MockCatalog {
  static String _img(String seed) =>
      'https://picsum.photos/seed/$seed/900/1200';

  static const List<Category> categories = <Category>[
    Category(id: 'rtw', name: 'Ready-to-Wear', tagline: 'The seasonal atelier'),
    Category(
      id: 'outerwear',
      name: 'Outerwear',
      tagline: 'Sculpted silhouettes',
    ),
    Category(
      id: 'leather',
      name: 'Leather Goods',
      tagline: 'Crafted to endure',
    ),
    Category(id: 'knitwear', name: 'Knitwear', tagline: 'Quiet luxury'),
  ];

  static ProductMedia _image(String seed) => ProductMedia(
    id: 'm_$seed',
    type: ProductMediaType.image,
    url: _img(seed),
    thumbnailUrl: _img(seed),
  );

  static ProductVariant _variant({
    required String id,
    required String color,
    required String hex,
    required String seedBase,
    List<String> sizes = const <String>['XS', 'S', 'M', 'L', 'XL'],
  }) => ProductVariant(
    id: id,
    colorName: color,
    colorHex: hex,
    sizes: sizes,
    media: <ProductMedia>[
      _image('${seedBase}a'),
      _image('${seedBase}b'),
      _image('${seedBase}c'),
      ProductMedia(
        id: 'v_$seedBase',
        type: ProductMediaType.video,
        url:
            'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
        thumbnailUrl: _img('${seedBase}a'),
        caption: 'On the runway',
        durationSeconds: 15,
      ),
    ],
  );

  static final List<Product> products = <Product>[
    Product(
      id: 'p1',
      name: 'Silk Column Gown',
      brand: 'EBANI',
      categoryId: 'rtw',
      price: Money.fromMajor(2890),
      isNew: true,
      description:
          'A floor-grazing column in fluid silk crêpe, cut on the bias to '
          'trace the body and pool softly at the hem.',
      materials: <String>['100% Silk Crêpe', 'Made in Italy'],
      aiHighlights: <String>[
        'Bias-cut for a liquid drape',
        'Hand-finished French seams',
        'Pairs with the Onyx clutch',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p1v1',
          color: 'Onyx',
          hex: '#141210',
          seedBase: 'gown-onyx',
        ),
        _variant(
          id: 'p1v2',
          color: 'Champagne',
          hex: '#C9A97E',
          seedBase: 'gown-champ',
        ),
        _variant(
          id: 'p1v3',
          color: 'Burgundy',
          hex: '#5B2130',
          seedBase: 'gown-bord',
        ),
      ],
    ),
    Product(
      id: 'p2',
      name: 'Tailored Wool Blazer',
      brand: 'EBANI',
      categoryId: 'rtw',
      price: Money.fromMajor(1650),
      description:
          'A sharply tailored single-breasted blazer in virgin wool with a '
          'softly structured shoulder.',
      materials: <String>['Virgin Wool', 'Cupro Lining'],
      aiHighlights: <String>[
        'Softly structured shoulder',
        'Horn buttons',
        'Tonal pick-stitch lapel',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p2v1',
          color: 'Charcoal',
          hex: '#37342F',
          seedBase: 'blazer-char',
        ),
        _variant(
          id: 'p2v2',
          color: 'Camel',
          hex: '#B79268',
          seedBase: 'blazer-camel',
        ),
      ],
    ),
    Product(
      id: 'p3',
      name: 'Cashmere Trench',
      brand: 'EBANI',
      categoryId: 'outerwear',
      price: Money.fromMajor(3450),
      isNew: true,
      description:
          'A double-faced cashmere trench with a belted waist and a fluid, '
          'unlined construction.',
      materials: <String>['Double-faced Cashmere'],
      aiHighlights: <String>[
        'Double-faced, fully reversible',
        'Belted waist',
        'Weightless warmth',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p3v1',
          color: 'Stone',
          hex: '#B4ABA0',
          seedBase: 'trench-stone',
        ),
        _variant(
          id: 'p3v2',
          color: 'Ink',
          hex: '#1F2430',
          seedBase: 'trench-ink',
        ),
      ],
    ),
    Product(
      id: 'p4',
      name: 'Structured Leather Tote',
      brand: 'EBANI',
      categoryId: 'leather',
      price: Money.fromMajor(1980),
      description:
          'An architectural tote in full-grain calfskin with hand-burnished '
          'edges and a suede interior.',
      materials: <String>['Full-grain Calfskin', 'Suede Lining'],
      aiHighlights: <String>[
        'Hand-burnished edges',
        'Fits a 15" laptop',
        'Palladium hardware',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p4v1',
          color: 'Cognac',
          hex: '#8A4B2F',
          seedBase: 'tote-cognac',
          sizes: <String>['One Size'],
        ),
        _variant(
          id: 'p4v2',
          color: 'Black',
          hex: '#141210',
          seedBase: 'tote-black',
          sizes: <String>['One Size'],
        ),
      ],
    ),
    Product(
      id: 'p5',
      name: 'Ribbed Cashmere Knit',
      brand: 'EBANI',
      categoryId: 'knitwear',
      price: Money.fromMajor(890),
      description:
          'A relaxed rib-knit sweater in pure Mongolian cashmere with a '
          'dropped shoulder.',
      materials: <String>['Pure Mongolian Cashmere'],
      aiHighlights: <String>[
        'Grade-A long-fibre cashmere',
        'Dropped shoulder',
        'Ribbed cuffs and hem',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p5v1',
          color: 'Oat',
          hex: '#D8CDBD',
          seedBase: 'knit-oat',
        ),
        _variant(
          id: 'p5v2',
          color: 'Slate',
          hex: '#5C6670',
          seedBase: 'knit-slate',
        ),
        _variant(
          id: 'p5v3',
          color: 'Black',
          hex: '#141210',
          seedBase: 'knit-noir',
        ),
      ],
    ),
    Product(
      id: 'p6',
      name: 'Pleated Midi Skirt',
      brand: 'EBANI',
      categoryId: 'rtw',
      price: Money.fromMajor(1120),
      description:
          'A knife-pleated midi skirt in metallic-sheen satin that catches '
          'the light with every step.',
      materials: <String>['Satin-back Crêpe'],
      aiHighlights: <String>[
        'Permanent knife pleats',
        'Concealed side zip',
        'Metallic sheen',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p6v1',
          color: 'Pewter',
          hex: '#8E8B84',
          seedBase: 'skirt-pewter',
        ),
        _variant(
          id: 'p6v2',
          color: 'Emerald',
          hex: '#1F5B4E',
          seedBase: 'skirt-emerald',
        ),
      ],
    ),
    Product(
      id: 'p7',
      name: 'Quilted Field Jacket',
      brand: 'EBANI',
      categoryId: 'outerwear',
      price: Money.fromMajor(1390),
      description:
          'A diamond-quilted field jacket with a corduroy collar and a '
          'water-repellent shell.',
      materials: <String>['Recycled Nylon Shell', 'Corduroy Collar'],
      aiHighlights: <String>[
        'Water-repellent shell',
        'Diamond quilting',
        'Snap-stud placket',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p7v1',
          color: 'Olive',
          hex: '#5A5A3C',
          seedBase: 'field-olive',
        ),
        _variant(
          id: 'p7v2',
          color: 'Navy',
          hex: '#26303F',
          seedBase: 'field-navy',
        ),
      ],
    ),
    Product(
      id: 'p8',
      name: 'Leather Chelsea Boot',
      brand: 'EBANI',
      categoryId: 'leather',
      price: Money.fromMajor(1240),
      description:
          'A refined Chelsea boot in polished calf leather with elasticated '
          'side gussets and a leather sole.',
      materials: <String>['Polished Calf Leather', 'Leather Sole'],
      aiHighlights: <String>[
        'Goodyear-welted',
        'Elasticated gussets',
        'Blake-stitched sole',
      ],
      variants: <ProductVariant>[
        _variant(
          id: 'p8v1',
          color: 'Black',
          hex: '#141210',
          seedBase: 'boot-black',
          sizes: <String>['40', '41', '42', '43', '44'],
        ),
        _variant(
          id: 'p8v2',
          color: 'Chestnut',
          hex: '#6E4227',
          seedBase: 'boot-chest',
          sizes: <String>['40', '41', '42', '43', '44'],
        ),
      ],
    ),
  ];
}
