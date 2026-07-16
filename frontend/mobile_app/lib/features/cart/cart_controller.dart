import 'package:flutter/foundation.dart';

import '../../models/cart.dart';
import '../../models/product.dart';

/// Owns the cart, which in this showroom doubles as the salesperson's
/// **shortlist and on-screen selector**. Adding an item optionally presents it;
/// tapping a cart item re-presents it on the display (wired in the UI layer).
class CartController extends ChangeNotifier {
  Cart _cart = const Cart();
  Cart get cart => _cart;

  void addItem(
    Product product, {
    required String variantId,
    required String size,
  }) {
    final CartItem incoming = CartItem(
      product: product,
      variantId: variantId,
      size: size,
    );
    final List<CartItem> items = List<CartItem>.of(_cart.items);
    final int idx = items.indexWhere(
      (CartItem i) => i.lineId == incoming.lineId,
    );
    if (idx >= 0) {
      items[idx] = items[idx].copyWith(quantity: items[idx].quantity + 1);
    } else {
      items.add(incoming);
    }
    _cart = _cart.copyWith(items: items);
    notifyListeners();
  }

  void setQuantity(String lineId, int quantity) {
    final List<CartItem> items = List<CartItem>.of(_cart.items);
    final int idx = items.indexWhere((CartItem i) => i.lineId == lineId);
    if (idx < 0) return;
    if (quantity <= 0) {
      items.removeAt(idx);
    } else {
      items[idx] = items[idx].copyWith(quantity: quantity);
    }
    _cart = _cart.copyWith(items: items);
    notifyListeners();
  }

  void removeItem(String lineId) {
    final List<CartItem> items = _cart.items
        .where((CartItem i) => i.lineId != lineId)
        .toList();
    _cart = _cart.copyWith(items: items);
    notifyListeners();
  }

  void clear() {
    _cart = const Cart();
    notifyListeners();
  }
}
