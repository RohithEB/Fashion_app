import 'money.dart';

/// A persisted checkout order returned by the backend
/// (`POST /api/cart/:sessionId/checkout`). Monetary fields arrive as major-unit
/// amounts (e.g. `19116` = ₹19,116) and are wrapped in [Money] for display.
class Order {
  const Order({
    required this.id,
    required this.status,
    required this.itemCount,
    required this.subtotal,
    required this.tax,
    required this.total,
    required this.createdAt,
    this.items = const <OrderItem>[],
    this.customerName,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final String currency = json['currency'] as String? ?? 'INR';
    Money money(String key) =>
        Money.fromMajor((json[key] as num?) ?? 0, currency: currency);
    final List<dynamic> rawItems =
        (json['items'] as List<dynamic>?) ?? const <dynamic>[];
    final Map<String, dynamic>? customer =
        json['customer'] as Map<String, dynamic>?;
    return Order(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'placed',
      itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
      subtotal: money('subtotal'),
      tax: money('tax'),
      total: money('total'),
      createdAt: json['createdAt'] as String? ?? '',
      items: rawItems
          .map((dynamic e) =>
              OrderItem.fromJson(e as Map<String, dynamic>, currency))
          .toList(),
      customerName: customer?['name'] as String?,
    );
  }

  final String id;
  final String status;
  final int itemCount;
  final Money subtotal;
  final Money tax;
  final Money total;
  final String createdAt;
  final List<OrderItem> items;
  final String? customerName;
}

/// A single priced line snapshot on an [Order].
class OrderItem {
  const OrderItem({
    required this.name,
    required this.quantity,
    required this.lineTotal,
    this.color,
    this.size,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json, String currency) =>
      OrderItem(
        name: json['name'] as String? ?? 'Item',
        quantity: (json['quantity'] as num?)?.toInt() ?? 1,
        lineTotal:
            Money.fromMajor((json['lineTotal'] as num?) ?? 0, currency: currency),
        color: json['color'] as String?,
        size: json['size'] as String?,
      );

  final String name;
  final int quantity;
  final Money lineTotal;
  final String? color;
  final String? size;
}
