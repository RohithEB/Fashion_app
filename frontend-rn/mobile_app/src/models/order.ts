import { Money } from './money';

/// A single priced line snapshot on an Order. Ported from `OrderItem`.
export class OrderItem {
  readonly name: string;
  readonly quantity: number;
  readonly lineTotal: Money;
  readonly color?: string;
  readonly size?: string;

  constructor(init: { name: string; quantity: number; lineTotal: Money; color?: string; size?: string }) {
    this.name = init.name;
    this.quantity = init.quantity;
    this.lineTotal = init.lineTotal;
    this.color = init.color;
    this.size = init.size;
  }

  static fromJson(json: any, currency: string): OrderItem {
    return new OrderItem({
      name: (json.name as string) ?? 'Item',
      quantity: json.quantity != null ? Math.trunc(json.quantity) : 1,
      lineTotal: Money.fromMajor((json.lineTotal as number) ?? 0, currency),
      color: json.color as string | undefined,
      size: json.size as string | undefined,
    });
  }
}

/// A persisted checkout order returned by the backend
/// (`POST /api/cart/:sessionId/checkout`). Ported from `Order`.
export class Order {
  readonly id: string;
  readonly status: string;
  readonly itemCount: number;
  readonly subtotal: Money;
  readonly tax: Money;
  readonly total: Money;
  readonly createdAt: string;
  readonly items: OrderItem[];
  readonly customerName?: string;

  constructor(init: {
    id: string;
    status: string;
    itemCount: number;
    subtotal: Money;
    tax: Money;
    total: Money;
    createdAt: string;
    items?: OrderItem[];
    customerName?: string;
  }) {
    this.id = init.id;
    this.status = init.status;
    this.itemCount = init.itemCount;
    this.subtotal = init.subtotal;
    this.tax = init.tax;
    this.total = init.total;
    this.createdAt = init.createdAt;
    this.items = init.items ?? [];
    this.customerName = init.customerName;
  }

  static fromJson(json: any): Order {
    const currency = (json.currency as string) ?? 'INR';
    const money = (key: string) => Money.fromMajor((json[key] as number) ?? 0, currency);
    const rawItems = (json.items as any[]) ?? [];
    const customer = json.customer as Record<string, any> | undefined;
    return new Order({
      id: json.id as string,
      status: (json.status as string) ?? 'placed',
      itemCount: json.itemCount != null ? Math.trunc(json.itemCount) : 0,
      subtotal: money('subtotal'),
      tax: money('tax'),
      total: money('total'),
      createdAt: (json.createdAt as string) ?? '',
      items: rawItems.map((e) => OrderItem.fromJson(e, currency)),
      customerName: customer?.name as string | undefined,
    });
  }
}
