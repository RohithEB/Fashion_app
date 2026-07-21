import { AppConfig } from '../config/appConfig';
import { Cart, CartItem } from '../models/cart';
import { Order } from '../models/order';

/// A thrown checkout failure carrying a human-readable message.
export class CheckoutException extends Error {}

/// Optional customer capture attached to a checkout.
export class CustomerDraft {
  readonly name?: string;
  readonly mobile?: string;
  constructor(init?: { name?: string; mobile?: string }) {
    this.name = init?.name;
    this.mobile = init?.mobile;
  }
  get isEmpty(): boolean {
    return (this.name == null || this.name.trim().length === 0) && (this.mobile == null || this.mobile.trim().length === 0);
  }
  toJson(): Record<string, any> {
    const out: Record<string, any> = {};
    if (this.name != null && this.name.trim().length > 0) out.name = this.name.trim();
    if (this.mobile != null && this.mobile.trim().length > 0) out.mobile = this.mobile.trim();
    return out;
  }
}

export interface CheckoutRepository {
  checkout(opts: { sessionId: string; token: string; cart: Cart; customer?: CustomerDraft }): Promise<Order>;
}

function itemsPayload(cart: Cart): Record<string, any>[] {
  return cart.items.map((i: CartItem) => ({
    productId: i.product.id,
    variantId: i.variantId,
    size: i.size,
    quantity: i.quantity,
  }));
}

/// Persists the controller-side cart as an order via the backend. Ported 1:1.
export class HttpCheckoutRepository implements CheckoutRepository {
  private static readonly timeoutMs = 8000;

  async checkout(opts: { sessionId: string; token: string; cart: Cart; customer?: CustomerDraft }): Promise<Order> {
    const body: Record<string, any> = { items: itemsPayload(opts.cart) };
    if (opts.customer != null && !opts.customer.isEmpty) body.customer = opts.customer.toJson();

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), HttpCheckoutRepository.timeoutMs);
    let res: Response;
    try {
      res = await fetch(AppConfig.http(`/api/cart/${opts.sessionId}/checkout`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.token}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new CheckoutException('Could not reach the server. Check the connection.');
    } finally {
      clearTimeout(t);
    }
    const json = await res.json().catch(() => ({}));
    if (res.status === 200 || res.status === 201) return Order.fromJson(json);
    const err = json.error;
    const message =
      err != null && typeof err === 'object' ? (err.message as string) ?? 'Checkout failed' : 'Checkout failed';
    throw new CheckoutException(message);
  }
}

/// Offline/demo checkout: builds an Order locally from the cart totals.
export class MockCheckoutRepository implements CheckoutRepository {
  async checkout(opts: { sessionId: string; token: string; cart: Cart; customer?: CustomerDraft }): Promise<Order> {
    const now = Date.now();
    return new Order({
      id: `demo_${now}`,
      status: 'placed',
      itemCount: opts.cart.count,
      subtotal: opts.cart.subtotal,
      tax: opts.cart.tax,
      total: opts.cart.total,
      createdAt: new Date(now).toISOString(),
      customerName: opts.customer?.name,
    });
  }
}
