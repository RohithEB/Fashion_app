import '../models/category.dart';
import '../models/product.dart';
import 'mock_catalog.dart';

/// Contract for catalog access. The UI depends only on this interface; the
/// mock implementation is swapped for an HTTP-backed one when the backend
/// clothes API is ready — no UI refactoring required.
abstract interface class CatalogRepository {
  Future<List<Category>> categories();
  Future<List<Product>> products({String? categoryId, String? query});
  Future<Product?> productById(String id);
}

/// In-memory implementation backed by [MockCatalog]. Simulates async latency
/// so loading states are exercised exactly as they will be against the network.
class MockCatalogRepository implements CatalogRepository {
  const MockCatalogRepository();

  static const Duration _latency = Duration(milliseconds: 350);

  @override
  Future<List<Category>> categories() async {
    await Future<void>.delayed(_latency);
    return MockCatalog.categories;
  }

  @override
  Future<List<Product>> products({String? categoryId, String? query}) async {
    await Future<void>.delayed(_latency);
    final String? q = query?.trim().toLowerCase();
    return MockCatalog.products.where((Product p) {
      final bool matchesCategory = categoryId == null || p.categoryId == categoryId;
      final bool matchesQuery = q == null ||
          q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.brand.toLowerCase().contains(q) ||
          p.aiHighlights.any((String h) => h.toLowerCase().contains(q));
      return matchesCategory && matchesQuery;
    }).toList();
  }

  @override
  Future<Product?> productById(String id) async {
    await Future<void>.delayed(_latency);
    return MockCatalog.products.where((Product p) => p.id == id).firstOrNull;
  }
}
