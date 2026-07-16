import 'money.dart';
import 'product.dart';

/// A line item in the cart / shortlist. In this showroom the cart doubles as
/// the salesperson's shortlist and on-screen selector.
class CartItem {
  const CartItem({
    required this.product,
    required this.variantId,
    required this.size,
    this.quantity = 1,
  });

  final Product product;
  final String variantId;
  final String size;
  final int quantity;

  ProductVariant get variant => product.variantById(variantId);

  Money get unitPrice => variant.price ?? product.price;

  Money get lineTotal => unitPrice * quantity;

  /// Stable identity for a configured line (product + variant + size).
  String get lineId => '${product.id}:$variantId:$size';

  CartItem copyWith({int? quantity, String? variantId, String? size}) =>
      CartItem(
        product: product,
        variantId: variantId ?? this.variantId,
        size: size ?? this.size,
        quantity: quantity ?? this.quantity,
      );
}

/// The cart aggregate. Totals are computed here for the POC; in production the
/// server is authoritative and these mirror the server response.
class Cart {
  const Cart({
    this.items = const <CartItem>[],
    this.taxRate = 0.08,
    this.discountRate = 0,
  });

  final List<CartItem> items;
  final double taxRate;
  final double discountRate;

  bool get isEmpty => items.isEmpty;
  int get count => items.fold(0, (int sum, CartItem i) => sum + i.quantity);

  Money get subtotal => items.isEmpty
      ? const Money.zero()
      : items
            .map((CartItem i) => i.lineTotal)
            .reduce((Money a, Money b) => a + b);

  Money get discount => subtotal.percent(discountRate);
  Money get taxedBase =>
      Money(minorUnits: subtotal.minorUnits - discount.minorUnits);
  Money get tax => taxedBase.percent(taxRate);
  Money get total => Money(minorUnits: taxedBase.minorUnits + tax.minorUnits);

  Cart copyWith({
    List<CartItem>? items,
    double? taxRate,
    double? discountRate,
  }) => Cart(
    items: items ?? this.items,
    taxRate: taxRate ?? this.taxRate,
    discountRate: discountRate ?? this.discountRate,
  );
}
