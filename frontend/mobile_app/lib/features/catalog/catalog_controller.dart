import 'package:flutter/foundation.dart' hide Category;

import '../../data/catalog_repository.dart';
import '../../models/category.dart';
import '../../models/product.dart';

enum LoadState { idle, loading, ready, error }

/// Owns the private (salesperson-only) catalog browsing state: categories,
/// search query, category filter, and the resulting product list. Browsing
/// here never touches the display — that only happens via the presentation
/// controller's "Show on Screen".
class CatalogController extends ChangeNotifier {
  CatalogController(this._repo);

  final CatalogRepository _repo;

  LoadState state = LoadState.idle;
  List<Category> categories = <Category>[];
  List<Product> products = <Product>[];
  String? selectedCategoryId;
  String query = '';
  String? error;

  Future<void> load() async {
    state = LoadState.loading;
    notifyListeners();
    try {
      categories = await _repo.categories();
      products = await _repo.products();
      state = LoadState.ready;
    } catch (e) {
      error = 'Unable to load the collection.';
      state = LoadState.error;
    }
    notifyListeners();
  }

  Future<void> selectCategory(String? id) async {
    selectedCategoryId = id;
    await _refresh();
  }

  Future<void> search(String q) async {
    query = q;
    await _refresh();
  }

  /// Re-fetch the catalog with the current search/category filters — used by
  /// pull-to-refresh so newly added CMS products appear without an app restart.
  Future<void> refresh() => _refresh();

  Future<void> _refresh() async {
    state = LoadState.loading;
    notifyListeners();
    try {
      products = await _repo.products(
        categoryId: selectedCategoryId,
        query: query,
      );
      state = LoadState.ready;
    } catch (e) {
      error = 'Unable to load the collection.';
      state = LoadState.error;
    }
    notifyListeners();
  }
}
