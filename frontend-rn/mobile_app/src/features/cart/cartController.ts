import { Listenable } from '../../core/listenable';
import { Cart, CartItem } from '../../models/cart';
import { Product } from '../../models/product';

/// Owns the cart, which doubles as the salesperson's shortlist and on-screen
/// selector. Ported 1:1 from `CartController`.
export class CartController extends Listenable {
  private _cart = new Cart();
  get cart(): Cart {
    return this._cart;
  }

  addItem(product: Product, opts: { variantId: string; size: string }): void {
    const incoming = new CartItem({ product, variantId: opts.variantId, size: opts.size });
    const items = [...this._cart.items];
    const idx = items.findIndex((i) => i.lineId === incoming.lineId);
    if (idx >= 0) {
      items[idx] = items[idx].copyWith({ quantity: items[idx].quantity + 1 });
    } else {
      items.push(incoming);
    }
    this._cart = this._cart.copyWith({ items });
    this.notifyListeners();
  }

  setQuantity(lineId: string, quantity: number): void {
    const items = [...this._cart.items];
    const idx = items.findIndex((i) => i.lineId === lineId);
    if (idx < 0) return;
    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx] = items[idx].copyWith({ quantity });
    }
    this._cart = this._cart.copyWith({ items });
    this.notifyListeners();
  }

  /// Change the size of an existing line — merges with an existing same-size line.
  setSize(lineId: string, size: string): void {
    const items = [...this._cart.items];
    const idx = items.findIndex((i) => i.lineId === lineId);
    if (idx < 0) return;
    const resized = items[idx].copyWith({ size });
    if (resized.lineId === lineId) return; // unchanged
    const existing = items.findIndex((i) => i.lineId === resized.lineId);
    if (existing >= 0) {
      items[existing] = items[existing].copyWith({ quantity: items[existing].quantity + resized.quantity });
      items.splice(idx, 1);
    } else {
      items[idx] = resized;
    }
    this._cart = this._cart.copyWith({ items });
    this.notifyListeners();
  }

  removeItem(lineId: string): void {
    this._cart = this._cart.copyWith({ items: this._cart.items.filter((i) => i.lineId !== lineId) });
    this.notifyListeners();
  }

  clear(): void {
    this._cart = new Cart();
    this.notifyListeners();
  }
}
