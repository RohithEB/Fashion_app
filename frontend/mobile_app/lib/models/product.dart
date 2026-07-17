import 'money.dart';

/// Kind of media attached to a product.
enum ProductMediaType { image, video, lookbook }

/// A single media asset (image or video) for a product/colorway.
class ProductMedia {
  const ProductMedia({
    required this.id,
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.caption,
    this.durationSeconds,
  });

  factory ProductMedia.fromJson(Map<String, dynamic> json) => ProductMedia(
    id: json['id'] as String,
    type: ProductMediaType.values.byName(json['type'] as String),
    url: json['url'] as String,
    thumbnailUrl: json['thumbnailUrl'] as String?,
    caption: json['caption'] as String?,
    durationSeconds: (json['durationSeconds'] as num?)?.toInt(),
  );

  final String id;
  final ProductMediaType type;
  final String url;
  final String? thumbnailUrl;
  final String? caption;
  final int? durationSeconds;

  bool get isVideo => type == ProductMediaType.video;
}

/// A purchasable colorway/size combination of a [Product].
class ProductVariant {
  const ProductVariant({
    required this.id,
    required this.colorName,
    required this.colorHex,
    required this.sizes,
    required this.media,
    this.price,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
    id: json['id'] as String,
    colorName: json['colorName'] as String,
    colorHex: json['colorHex'] as String,
    sizes: (json['sizes'] as List<dynamic>).cast<String>(),
    media: (json['media'] as List<dynamic>)
        .map((dynamic e) => ProductMedia.fromJson(e as Map<String, dynamic>))
        .toList(),
    price: json['price'] == null
        ? null
        : Money.fromJson(json['price'] as Map<String, dynamic>),
  );

  final String id;
  final String colorName;

  /// Hex string like `#1A1A1A` used to render the color swatch.
  final String colorHex;
  final List<String> sizes;
  final List<ProductMedia> media;

  /// Variant-specific price override; falls back to [Product.price].
  final Money? price;

  List<ProductMedia> get images => media
      .where((ProductMedia m) => m.type == ProductMediaType.image)
      .toList();

  ProductMedia? get video =>
      media.where((ProductMedia m) => m.isVideo).firstOrNull;
}

/// A labeled enrichment attribute (e.g. Fabric → "100% linen", Vibe → "Elegant").
/// Rendered as a key/value row in the expandable "all details" section.
class ProductDetail {
  const ProductDetail({required this.label, required this.value});

  final String label;
  final String value;
}

/// A catalog product, enriched with AI-generated highlights and related media.
class Product {
  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.categoryId,
    required this.price,
    required this.variants,
    this.description = '',
    this.aiHighlights = const <String>[],
    this.materials = const <String>[],
    this.details = const <ProductDetail>[],
    this.isNew = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
    id: json['id'] as String,
    name: json['name'] as String,
    brand: json['brand'] as String,
    categoryId: json['categoryId'] as String,
    price: Money.fromJson(json['price'] as Map<String, dynamic>),
    variants: (json['variants'] as List<dynamic>)
        .map((dynamic e) => ProductVariant.fromJson(e as Map<String, dynamic>))
        .toList(),
    description: json['description'] as String? ?? '',
    aiHighlights:
        (json['aiHighlights'] as List<dynamic>?)?.cast<String>() ??
        const <String>[],
    materials:
        (json['materials'] as List<dynamic>?)?.cast<String>() ??
        const <String>[],
    isNew: json['isNew'] as bool? ?? false,
  );

  final String id;
  final String name;
  final String brand;
  final String categoryId;
  final Money price;
  final List<ProductVariant> variants;
  final String description;

  /// AI-generated selling points (enrichment served by the catalog API).
  final List<String> aiHighlights;
  final List<String> materials;

  /// Full labeled enrichment (fabric, vibe, season, occasion, fit, rating, …),
  /// revealed when the details sheet is dragged up.
  final List<ProductDetail> details;
  final bool isNew;

  ProductVariant get defaultVariant => variants.first;

  ProductVariant variantById(String? id) =>
      variants.where((ProductVariant v) => v.id == id).firstOrNull ??
      defaultVariant;

  /// Primary display image (first image of the first variant).
  String? get heroImage => defaultVariant.images.firstOrNull?.url;

  @override
  bool operator ==(Object other) => other is Product && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
