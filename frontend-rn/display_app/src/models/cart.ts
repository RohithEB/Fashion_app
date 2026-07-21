import { Money } from './money';
import { Product, ProductVariant } from './product';

/// A line item in the cart / shortlist. Ported from the Flutter `CartItem`.
export class CartItem {
  readonly product: Product;
  readonly variantId: string;
  readonly size: string;
  readonly quantity: number;

  constructor(init: { product: Product; variantId: string; size: string; quantity?: number }) {
    this.product = init.product;
    this.variantId = init.variantId;
    this.size = init.size;
    this.quantity = init.quantity ?? 1;
  }

  get variant(): ProductVariant {
    return this.product.variantById(this.variantId);
  }

  get unitPrice(): Money {
    return this.variant.price ?? this.product.price;
  }

  get lineTotal(): Money {
    return this.unitPrice.times(this.quantity);
  }

  /// Stable identity for a configured line (product + variant + size).
  get lineId(): string {
    return `${this.product.id}:${this.variantId}:${this.size}`;
  }

  copyWith(patch: { quantity?: number; variantId?: string; size?: string }): CartItem {
    return new CartItem({
      product: this.product,
      variantId: patch.variantId ?? this.variantId,
      size: patch.size ?? this.size,
      quantity: patch.quantity ?? this.quantity,
    });
  }
}

/// The cart aggregate. Totals computed here for the POC. Ported from `Cart`.
export class Cart {
  readonly items: CartItem[];
  readonly taxRate: number;
  readonly discountRate: number;

  constructor(init?: { items?: CartItem[]; taxRate?: number; discountRate?: number }) {
    this.items = init?.items ?? [];
    this.taxRate = init?.taxRate ?? 0.08;
    this.discountRate = init?.discountRate ?? 0;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  get count(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  get subtotal(): Money {
    if (this.items.length === 0) return Money.zero();
    return this.items.map((i) => i.lineTotal).reduce((a, b) => a.plus(b));
  }

  get discount(): Money {
    return this.subtotal.percent(this.discountRate);
  }

  get taxedBase(): Money {
    return new Money(this.subtotal.minorUnits - this.discount.minorUnits);
  }

  get tax(): Money {
    return this.taxedBase.percent(this.taxRate);
  }

  get total(): Money {
    return new Money(this.taxedBase.minorUnits + this.tax.minorUnits);
  }

  copyWith(patch: { items?: CartItem[]; taxRate?: number; discountRate?: number }): Cart {
    return new Cart({
      items: patch.items ?? this.items,
      taxRate: patch.taxRate ?? this.taxRate,
      discountRate: patch.discountRate ?? this.discountRate,
    });
  }
}
