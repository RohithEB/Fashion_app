import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../models/cart.dart';
import '../models/order.dart';

/// A thrown checkout failure carrying a human-readable message.
class CheckoutException implements Exception {
  const CheckoutException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Optional customer capture attached to a checkout.
class CustomerDraft {
  const CustomerDraft({this.name, this.mobile});

  final String? name;
  final String? mobile;

  bool get isEmpty =>
      (name == null || name!.trim().isEmpty) &&
      (mobile == null || mobile!.trim().isEmpty);

  Map<String, dynamic> toJson() => <String, dynamic>{
    if (name != null && name!.trim().isNotEmpty) 'name': name!.trim(),
    if (mobile != null && mobile!.trim().isNotEmpty) 'mobile': mobile!.trim(),
  };
}

/// Persists the controller-side cart as an order via the backend
/// (`POST /api/cart/:sessionId/checkout`). Swapped for [MockCheckoutRepository]
/// in standalone mode so the offline demo still completes a sale.
abstract interface class CheckoutRepository {
  Future<Order> checkout({
    required String sessionId,
    required String token,
    required Cart cart,
    CustomerDraft? customer,
  });
}

/// Maps cart lines to the backend's checkout item shape.
List<Map<String, dynamic>> _itemsPayload(Cart cart) => cart.items
    .map(
      (CartItem i) => <String, dynamic>{
        'productId': i.product.id,
        'variantId': i.variantId,
        'size': i.size,
        'quantity': i.quantity,
      },
    )
    .toList();

class HttpCheckoutRepository implements CheckoutRepository {
  HttpCheckoutRepository({http.Client? client})
    : _client = client ?? http.Client();

  final http.Client _client;
  static const Duration _timeout = Duration(seconds: 8);

  @override
  Future<Order> checkout({
    required String sessionId,
    required String token,
    required Cart cart,
    CustomerDraft? customer,
  }) async {
    final Map<String, dynamic> body = <String, dynamic>{
      'items': _itemsPayload(cart),
      if (customer != null && !customer.isEmpty) 'customer': customer.toJson(),
    };
    late final http.Response res;
    try {
      res = await _client
          .post(
            AppConfig.http('/api/cart/$sessionId/checkout'),
            headers: <String, String>{
              'content-type': 'application/json',
              'authorization': 'Bearer $token',
            },
            body: jsonEncode(body),
          )
          .timeout(_timeout);
    } catch (_) {
      throw const CheckoutException(
        'Could not reach the server. Check the connection.',
      );
    }
    final Map<String, dynamic> json =
        jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 || res.statusCode == 201) {
      return Order.fromJson(json);
    }
    final Object? err = json['error'];
    final String message = err is Map<String, dynamic>
        ? (err['message'] as String? ?? 'Checkout failed')
        : 'Checkout failed';
    throw CheckoutException(message);
  }
}

/// Offline/demo checkout: builds an [Order] locally from the cart totals.
class MockCheckoutRepository implements CheckoutRepository {
  const MockCheckoutRepository();

  @override
  Future<Order> checkout({
    required String sessionId,
    required String token,
    required Cart cart,
    CustomerDraft? customer,
  }) async {
    return Order(
      id: 'demo_${DateTime.now().millisecondsSinceEpoch}',
      status: 'placed',
      itemCount: cart.count,
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      createdAt: DateTime.now().toIso8601String(),
      customerName: customer?.name,
    );
  }
}
