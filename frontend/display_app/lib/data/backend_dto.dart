import '../core/config/app_config.dart';
import '../models/category.dart';
import '../models/money.dart';
import '../models/product.dart';

/// Maps the Node backend's JSON shapes (see docs/API.md) onto the app's domain
/// models. Kept isolated so the rest of the app is unaware of the wire format —
/// if the API changes, only this file moves.
abstract final class BackendDto {
  static Category category(Map<String, dynamic> json) {
    final String name = json['category'] as String;
    return Category(id: name, name: name);
  }

  static Money _price(Map<String, dynamic> json) => Money(
        minorUnits: (json['basePrice'] as num?)?.toInt() ?? 0,
        currency: json['currency'] as String? ?? 'INR',
      );

  static ProductMedia _image(String url) => ProductMedia(
        id: url.hashCode.toString(),
        type: ProductMediaType.image,
        url: AppConfig.media(url),
        thumbnailUrl: AppConfig.media(url),
      );

  /// Summary product from `GET /api/products` list items (no variants/media).
  static Product fromListItem(Map<String, dynamic> json) {
    final List<dynamic> colors =
        (json['colors'] as List<dynamic>?) ?? const <dynamic>[];
    final List<String> sizes =
        ((json['sizes'] as List<dynamic>?) ?? const <dynamic>[]).cast<String>();
    final String? hero = json['heroImage'] as String?;

    final List<ProductVariant> variants = colors.isEmpty
        ? <ProductVariant>[
            ProductVariant(
              id: 'default',
              colorName: 'Default',
              colorHex: '#141210',
              sizes: sizes.isEmpty ? const <String>['One Size'] : sizes,
              media: <ProductMedia>[if (hero != null) _image(hero)],
            ),
          ]
        : colors.map((dynamic c) {
            final Map<String, dynamic> cm = c as Map<String, dynamic>;
            return ProductVariant(
              id: cm['name'] as String,
              colorName: cm['name'] as String,
              colorHex: cm['hex'] as String? ?? '#141210',
              sizes: sizes.isEmpty ? const <String>['One Size'] : sizes,
              media: <ProductMedia>[if (hero != null) _image(hero)],
            );
          }).toList();

    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      brand: json['brand'] as String? ?? '',
      categoryId: json['category'] as String? ?? '',
      price: _price(json),
      variants: variants,
      isNew: (json['tags'] as List<dynamic>?)?.contains('new') ?? false,
    );
  }

  /// Rich product from `GET /api/products/:id` (variants + media + enrichment).
  static Product fromDetail(Map<String, dynamic> json) {
    final List<dynamic> colors =
        (json['colors'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawVariants =
        (json['variants'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> rawMedia =
        (json['media'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> enrichment =
        (json['enrichment'] as List<dynamic>?) ?? const <dynamic>[];
    final List<String> allSizes =
        ((json['sizes'] as List<dynamic>?) ?? const <dynamic>[]).cast<String>();

    // Shared video (if any) across colour variants.
    ProductMedia? video;
    for (final dynamic m in rawMedia) {
      final Map<String, dynamic> mm = m as Map<String, dynamic>;
      if (mm['type'] == 'video') {
        video = ProductMedia(
          id: mm['id'] as String,
          type: ProductMediaType.video,
          url: AppConfig.media(mm['url'] as String),
          thumbnailUrl: mm['posterUrl'] != null
              ? AppConfig.media(mm['posterUrl'] as String)
              : null,
          caption: mm['label'] as String?,
        );
        break;
      }
    }

    final List<ProductVariant> variants = colors.map((dynamic c) {
      final Map<String, dynamic> cm = c as Map<String, dynamic>;
      final String colorName = cm['name'] as String;

      final Iterable<Map<String, dynamic>> colorVariants = rawVariants
          .cast<Map<String, dynamic>>()
          .where((Map<String, dynamic> v) => v['color'] == colorName);

      final List<String> sizes = colorVariants
          .map((Map<String, dynamic> v) => v['size'] as String)
          .toSet()
          .toList();

      // Images: this colour's variant image + any media labelled for it.
      final List<ProductMedia> images = <ProductMedia>[];
      for (final Map<String, dynamic> v in colorVariants) {
        final String? url = v['mediaUrl'] as String?;
        if (url != null) images.add(_image(url));
      }
      for (final dynamic m in rawMedia) {
        final Map<String, dynamic> mm = m as Map<String, dynamic>;
        if (mm['type'] == 'image' && mm['label'] == colorName) {
          images.add(_image(mm['url'] as String));
        }
      }
      if (images.isEmpty && json['heroImage'] != null) {
        images.add(_image(json['heroImage'] as String));
      }

      return ProductVariant(
        id: colorVariants.isNotEmpty
            ? colorVariants.first['id'] as String
            : colorName,
        colorName: colorName,
        colorHex: cm['hex'] as String? ?? '#141210',
        sizes: sizes.isEmpty
            ? (allSizes.isEmpty ? const <String>['One Size'] : allSizes)
            : sizes,
        media: <ProductMedia>[...images, ?video],
      );
    }).toList();

    final List<String> highlights = <String>[];
    final List<String> materials = <String>[];
    final List<ProductDetail> details = <ProductDetail>[];
    for (final dynamic e in enrichment) {
      final Map<String, dynamic> em = e as Map<String, dynamic>;
      final String key = em['key'] as String? ?? '';
      final String value = em['value'] as String? ?? '';
      if (value.isEmpty) continue;
      final String lk = key.toLowerCase();
      if (lk == 'highlight') {
        highlights.add(value);
      } else {
        details.add(ProductDetail(label: key, value: value));
        if (lk.contains('fabric') || lk.contains('material') || lk.contains('composition')) {
          materials.add(value);
        }
      }
    }
    if (highlights.isEmpty) {
      highlights.addAll(details
          .where((ProductDetail d) =>
              !d.label.toLowerCase().contains('material') &&
              !d.label.toLowerCase().contains('fabric'))
          .map((ProductDetail d) => d.value)
          .take(4));
    }

    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      brand: json['brand'] as String? ?? '',
      categoryId: json['category'] as String? ?? '',
      price: _price(json),
      variants: variants.isEmpty
          ? <ProductVariant>[
              ProductVariant(
                id: 'default',
                colorName: 'Default',
                colorHex: '#141210',
                sizes: allSizes.isEmpty ? const <String>['One Size'] : allSizes,
                media: <ProductMedia>[
                  if (json['heroImage'] != null) _image(json['heroImage'] as String),
                ],
              ),
            ]
          : variants,
      description: json['description'] as String? ?? '',
      aiHighlights: highlights,
      materials: materials,
      details: details,
    );
  }
}
