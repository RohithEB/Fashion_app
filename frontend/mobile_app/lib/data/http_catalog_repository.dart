import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../models/category.dart';
import '../models/product.dart';
import 'backend_dto.dart';
import 'catalog_repository.dart';

/// [CatalogRepository] backed by the Node backend's HTTP API (docs/API.md).
/// Selected when [AppConfig.backendMode] is on; otherwise the app uses
/// [MockCatalogRepository]. The rest of the app is unaware which is in play.
class HttpCatalogRepository implements CatalogRepository {
  HttpCatalogRepository({http.Client? client})
    : _client = client ?? http.Client();

  final http.Client _client;
  static const Duration _timeout = Duration(seconds: 8);

  @override
  Future<List<Category>> categories() async {
    final http.Response res = await _client
        .get(AppConfig.http('/api/categories'))
        .timeout(_timeout);
    if (res.statusCode != 200) return const <Category>[];
    final Map<String, dynamic> body =
        jsonDecode(res.body) as Map<String, dynamic>;
    final List<dynamic> items =
        (body['categories'] as List<dynamic>?) ?? const <dynamic>[];
    return items
        .map((dynamic e) => BackendDto.category(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<Product>> products({String? categoryId, String? query}) async {
    final Map<String, dynamic> q = <String, dynamic>{
      'limit': 100,
      'category': ?categoryId,
      if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
    };
    final http.Response res = await _client
        .get(AppConfig.http('/api/products', q))
        .timeout(_timeout);
    if (res.statusCode != 200) return const <Product>[];
    final Map<String, dynamic> body =
        jsonDecode(res.body) as Map<String, dynamic>;
    final List<dynamic> items =
        (body['items'] as List<dynamic>?) ?? const <dynamic>[];
    return items
        .map((dynamic e) => BackendDto.fromListItem(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<Product?> productById(String id) async {
    final http.Response res = await _client
        .get(AppConfig.http('/api/products/$id'))
        .timeout(_timeout);
    if (res.statusCode != 200) return null;
    return BackendDto.fromDetail(jsonDecode(res.body) as Map<String, dynamic>);
  }

  @override
  Future<List<Product>> recommendations({
    String? gender,
    String? ageRange,
    String? personality,
    String? customerId,
    int limit = 12,
  }) async {
    final Map<String, dynamic> q = <String, dynamic>{
      'limit': limit,
      if (gender != null && gender.isNotEmpty) 'gender': gender,
      if (ageRange != null && ageRange.isNotEmpty) 'ageRange': ageRange,
      if (personality != null && personality.isNotEmpty)
        'personality': personality,
      if (customerId != null && customerId.isNotEmpty) 'customerId': customerId,
    };
    final http.Response res = await _client
        .get(AppConfig.http('/api/recommendations', q))
        .timeout(_timeout);
    if (res.statusCode != 200) return const <Product>[];
    final Map<String, dynamic> body =
        jsonDecode(res.body) as Map<String, dynamic>;
    final List<dynamic> items =
        (body['items'] as List<dynamic>?) ?? const <dynamic>[];
    return items
        .map((dynamic e) => BackendDto.fromListItem(e as Map<String, dynamic>))
        .toList();
  }
}
