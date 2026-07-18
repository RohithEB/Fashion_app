import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/category.dart';
import '../models/product.dart';
import 'backend_dto.dart';
import 'catalog_repository.dart';

/// Fully-offline [CatalogRepository] backed by a bundled snapshot of the real
/// catalog (`assets/catalog_snapshot.json`, exported from the backend). Used in
/// **box-as-server / offline mode**: no HTTP, no backend — browsing is instant
/// and works with no internet. Placeholder images render on-device.
class BundledCatalogRepository implements CatalogRepository {
  BundledCatalogRepository();

  List<_Entry>? _entries;

  static const Map<String, String> _genderMap = <String, String>{
    'female': 'women',
    'male': 'men',
    'women': 'women',
    'men': 'men',
  };

  Future<List<_Entry>> _ensure() async {
    if (_entries != null) return _entries!;
    final String raw = await rootBundle.loadString(
      'assets/catalog_snapshot.json',
    );
    final Map<String, dynamic> snap = jsonDecode(raw) as Map<String, dynamic>;
    final List<dynamic> products =
        (snap['products'] as List<dynamic>?) ?? const <dynamic>[];
    _entries = products
        .map((dynamic e) => _Entry.fromJson(e as Map<String, dynamic>))
        .toList();
    return _entries!;
  }

  @override
  Future<List<Category>> categories() async {
    final List<_Entry> list = await _ensure();
    final Set<String> seen = <String>{};
    final List<Category> cats = <Category>[];
    for (final _Entry e in list) {
      final String id = e.product.categoryId;
      if (id.isNotEmpty && seen.add(id)) cats.add(Category(id: id, name: id));
    }
    cats.sort((Category a, Category b) => a.name.compareTo(b.name));
    return cats;
  }

  @override
  Future<List<Product>> products({
    String? categoryId,
    String? query,
    String? color,
  }) async {
    final List<_Entry> list = await _ensure();
    final String? q = query?.trim().toLowerCase();
    final String? col = color?.trim().toLowerCase();
    return list
        .where((_Entry e) {
          final bool okCat =
              categoryId == null || e.product.categoryId == categoryId;
          final bool okQ = q == null || q.isEmpty || e.searchText.contains(q);
          final bool okColor =
              col == null ||
              e.product.variants.any(
                (ProductVariant v) => v.colorName.toLowerCase() == col,
              );
          return okCat && okQ && okColor;
        })
        .map((_Entry e) => e.product)
        .toList();
  }

  @override
  Future<Product?> productById(String id) async {
    final List<_Entry> list = await _ensure();
    return list
        .where((_Entry e) => e.product.id == id)
        .map((_Entry e) => e.product)
        .firstOrNull;
  }

  @override
  Future<List<Product>> recommendations({
    String? gender,
    String? ageRange,
    String? personality,
    String? customerId,
    int limit = 12,
  }) async {
    final List<_Entry> list = await _ensure();
    final String? wantGender =
        _genderMap[(gender ?? '').toLowerCase()];
    final String persona = (personality ?? '').trim().toLowerCase();

    final List<_Entry> scored = List<_Entry>.of(list);
    int scoreOf(_Entry e) {
      int s = 0;
      if (wantGender != null &&
          (e.gender == wantGender || e.gender == 'unisex')) {
        s += 3;
      }
      if (persona.isNotEmpty && e.searchText.contains(persona)) s += 2;
      if (e.hasHighlights) s += 1;
      return s;
    }

    scored.sort((_Entry a, _Entry b) => scoreOf(b).compareTo(scoreOf(a)));
    return scored.take(limit).map((_Entry e) => e.product).toList();
  }

  @override
  Future<String?> talkingPoint({
    required String productId,
    String? customerId,
    String? personality,
    String? name,
  }) async {
    final List<_Entry> list = await _ensure();
    final _Entry? entry = list
        .where((_Entry e) => e.product.id == productId)
        .firstOrNull;
    if (entry == null) return null;
    final Product p = entry.product;

    final String? who = (name != null && name.trim().isNotEmpty)
        ? name.trim()
        : null;
    final String persona = (personality ?? '').trim().toLowerCase();
    final String lead = who != null
        ? '$who, the ${p.name} feels like it was made for you'
        : 'The ${p.name} suits you beautifully';
    final String personaClause = persona.isNotEmpty
        ? ' — exactly the kind of piece a $persona eye gravitates to'
        : '';
    final String hl = p.aiHighlights.isNotEmpty
        ? ' ${p.aiHighlights.first}'
        : '';
    final String detail = p.materials.isNotEmpty
        ? ' Point out the ${p.materials.first.toLowerCase()}.'
        : '';
    return 'Say this: “$lead$personaClause.”$hl$detail';
  }
}

/// A parsed catalog entry: the domain [product] plus the raw attributes used for
/// offline recommendation scoring (kept off the shared [Product] model).
class _Entry {
  _Entry({
    required this.product,
    required this.gender,
    required this.searchText,
    required this.hasHighlights,
  });

  factory _Entry.fromJson(Map<String, dynamic> json) {
    final Product product = BackendDto.fromDetail(json);
    final List<dynamic> tags =
        (json['tags'] as List<dynamic>?) ?? const <dynamic>[];
    final List<dynamic> enrichment =
        (json['enrichment'] as List<dynamic>?) ?? const <dynamic>[];
    final StringBuffer sb = StringBuffer()
      ..write(json['name'] ?? '')
      ..write(' ')
      ..write(json['brand'] ?? '')
      ..write(' ')
      ..write(json['category'] ?? '')
      ..write(' ')
      ..write(json['description'] ?? '')
      ..write(' ')
      ..write(tags.join(' '));
    bool hasHighlights = false;
    for (final dynamic e in enrichment) {
      final Map<String, dynamic> em = e as Map<String, dynamic>;
      sb.write(' ${em['value'] ?? ''}');
      if ((em['key'] as String? ?? '').toLowerCase().contains('highlight')) {
        hasHighlights = true;
      }
    }
    return _Entry(
      product: product,
      gender: (json['gender'] as String? ?? '').toLowerCase(),
      searchText: sb.toString().toLowerCase(),
      hasHighlights: hasHighlights,
    );
  }

  final Product product;
  final String gender;
  final String searchText;
  final bool hasHighlights;
}
