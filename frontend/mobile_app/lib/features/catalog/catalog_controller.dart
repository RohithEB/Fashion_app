import 'dart:async';

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
  CatalogController(this._repo) {
    // Keep the catalogue fresh: silently re-hydrate from the backend every 2 min
    // so CMS edits/new products appear without a manual reload.
    _refreshTimer = Timer.periodic(
      const Duration(minutes: 2),
      (_) => refreshSilently(),
    );
  }

  final CatalogRepository _repo;
  Timer? _refreshTimer;

  LoadState state = LoadState.idle;
  List<Category> categories = <Category>[];
  List<Product> products = <Product>[];
  String? selectedCategoryId;
  String query = '';
  String? error;

  /// The last product opened in detail. Lets the router recover the product
  /// screen when go_router drops `state.extra` on a refresh (e.g. the idle
  /// warning), instead of crashing or bouncing to Home.
  Product? lastViewedProduct;

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

  /// Re-fetch the catalogue in the background without flashing a loading state.
  Future<void> refreshSilently() async {
    try {
      final List<Category> cats = await _repo.categories();
      final List<Product> prods = await _repo.products(
        categoryId: selectedCategoryId,
        query: query,
      );
      categories = cats;
      products = prods;
      if (state != LoadState.error) state = LoadState.ready;
      notifyListeners();
    } catch (_) {
      // Keep showing the last good data on a transient failure.
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
}
