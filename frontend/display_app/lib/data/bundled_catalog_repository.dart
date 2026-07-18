import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/category.dart';
import '../models/product.dart';
import 'backend_dto.dart';
import 'catalog_repository.dart';

/// Fully-offline [CatalogRepository] backed by a bundled snapshot of the real
/// catalog (`assets/catalog_snapshot.json`, exported from the backend). Used in
/// **box-as-server / offline mode**: the display hydrates its catalogue from the
/// bundle with no HTTP and no internet. Placeholder images render on-device.
class BundledCatalogRepository implements CatalogRepository {
  BundledCatalogRepository();

  List<Product>? _cache;

  Future<List<Product>> _ensure() async {
    if (_cache != null) return _cache!;
    final String raw = await rootBundle.loadString(
      'assets/catalog_snapshot.json',
    );
    final Map<String, dynamic> snap = jsonDecode(raw) as Map<String, dynamic>;
    final List<dynamic> products =
        (snap['products'] as List<dynamic>?) ?? const <dynamic>[];
    _cache = products
        .map((dynamic e) => BackendDto.fromDetail(e as Map<String, dynamic>))
        .toList();
    return _cache!;
  }

  @override
  Future<List<Category>> categories() async {
    final List<Product> list = await _ensure();
    final Set<String> seen = <String>{};
    final List<Category> cats = <Category>[];
    for (final Product p in list) {
      if (p.categoryId.isNotEmpty && seen.add(p.categoryId)) {
        cats.add(Category(id: p.categoryId, name: p.categoryId));
      }
    }
    cats.sort((Category a, Category b) => a.name.compareTo(b.name));
    return cats;
  }

  @override
  Future<List<Product>> products({String? categoryId, String? query}) async {
    final List<Product> list = await _ensure();
    final String? q = query?.trim().toLowerCase();
    return list.where((Product p) {
      final bool okCat = categoryId == null || p.categoryId == categoryId;
      final bool okQ =
          q == null ||
          q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.brand.toLowerCase().contains(q) ||
          p.aiHighlights.any((String h) => h.toLowerCase().contains(q));
      return okCat && okQ;
    }).toList();
  }

  @override
  Future<Product?> productById(String id) async {
    final List<Product> list = await _ensure();
    return list.where((Product p) => p.id == id).firstOrNull;
  }
}
