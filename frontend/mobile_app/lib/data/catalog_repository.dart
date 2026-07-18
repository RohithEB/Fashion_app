import '../models/category.dart';
import '../models/product.dart';
import 'mock_catalog.dart';

/// Contract for catalog access. The UI depends only on this interface; the
/// mock implementation is swapped for an HTTP-backed one when the backend
/// clothes API is ready — no UI refactoring required.
abstract interface class CatalogRepository {
  Future<List<Category>> categories();
  Future<List<Product>> products({String? categoryId, String? query, String? color});
  Future<Product?> productById(String id);

  /// Products matched to a customer's onboarding profile (gender · personality ·
  /// age range) against the enriched catalog attributes.
  Future<List<Product>> recommendations({
    String? gender,
    String? ageRange,
    String? personality,
    String? customerId,
    int limit,
  });

  /// A PRIVATE coaching cue for the associate (never shown on the display): a
  /// warm, specific line to say to the guest, generated from the product's AI
  /// enrichment + the guest profile. Returns null if unavailable.
  Future<String?> talkingPoint({
    required String productId,
    String? customerId,
    String? personality,
    String? name,
  });
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
  Future<List<Product>> products({
    String? categoryId,
    String? query,
    String? color,
  }) async {
    await Future<void>.delayed(_latency);
    final String? q = query?.trim().toLowerCase();
    return MockCatalog.products.where((Product p) {
      final bool matchesCategory =
          categoryId == null || p.categoryId == categoryId;
      final bool matchesColor =
          color == null ||
          p.variants.any(
            (ProductVariant v) =>
                v.colorName.toLowerCase() == color.toLowerCase(),
          );
      final bool matchesQuery =
          q == null ||
          q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.brand.toLowerCase().contains(q) ||
          p.aiHighlights.any((String h) => h.toLowerCase().contains(q));
      return matchesCategory && matchesColor && matchesQuery;
    }).toList();
  }

  @override
  Future<Product?> productById(String id) async {
    await Future<void>.delayed(_latency);
    return MockCatalog.products.where((Product p) => p.id == id).firstOrNull;
  }

  @override
  Future<List<Product>> recommendations({
    String? gender,
    String? ageRange,
    String? personality,
    String? customerId,
    int limit = 12,
  }) async {
    await Future<void>.delayed(_latency);
    return MockCatalog.products.take(limit).toList();
  }

  @override
  Future<String?> talkingPoint({
    required String productId,
    String? customerId,
    String? personality,
    String? name,
  }) async {
    await Future<void>.delayed(_latency);
    final Product? p = MockCatalog.products
        .where((Product x) => x.id == productId)
        .firstOrNull;
    if (p == null) return null;
    final String who = (name != null && name.trim().isNotEmpty)
        ? name.trim()
        : 'They';
    final String hl = p.aiHighlights.isNotEmpty ? ' ${p.aiHighlights.first}' : '';
    return 'Say this: “$who, the ${p.name} feels made for you.”$hl';
  }
}
