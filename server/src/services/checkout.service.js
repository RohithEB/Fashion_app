// Checkout: turn the controller-side cart into a persisted order.
// The mobile cart is client-side, so the priced lines arrive in the request body;
// the server re-prices them authoritatively from the catalog and snapshots the result.
import * as products from '../repositories/products.repo.js';
import * as customers from '../repositories/customers.repo.js';
import * as orders from '../repositories/orders.repo.js';
import { config } from '../config.js';
import { badRequest, notFound } from '../util/errors.js';

const round2 = (n) => Math.round(n * 100) / 100;

// Resolve or capture the customer. Returns a customerId or null.
function resolveCustomer({ customerId, customer }) {
  if (customerId) {
    const existing = customers.getCustomer(customerId);
    if (!existing) throw notFound('Customer not found');
    return existing.id;
  }
  const hasData = customer && (customer.name || customer.mobile || customer.gender || customer.age);
  if (!hasData) return null;
  const created = customers.createCustomer({
    name: customer.name?.trim() || null,
    mobile: customer.mobile?.trim() || null,
    gender: customer.gender?.trim() || null,
    age: customer.age == null || customer.age === '' ? null : Number(customer.age),
  });
  return created.id;
}

// items: [{ productId, variantId?, size?, quantity? }]
export function checkout(sessionId, { items, customer, customerId, salespersonId } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('Cart is empty — nothing to checkout');
  }

  let currency = 'INR';
  const lines = items.map((item) => {
    if (!item?.productId) throw badRequest('each item needs a productId');
    const product = products.getProductById(item.productId);
    if (!product) throw notFound(`Product not found: ${item.productId}`);

    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(product.basePrice) || 0;
    currency = product.currency || currency;

    // Snapshot color/size from the chosen variant when present.
    let color = null;
    let size = item.size ?? null;
    if (item.variantId) {
      const variant = products.getVariants(item.productId).find((v) => v.id === item.variantId);
      if (variant) {
        color = variant.color ?? null;
        size = variant.size ?? size;
      }
    }

    return {
      productId: product.id,
      variantId: item.variantId ?? null,
      name: product.name,
      color,
      size,
      unitPrice,
      quantity,
      lineTotal: round2(unitPrice * quantity),
    };
  });

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const discount = 0;
  const tax = round2((subtotal - discount) * config.taxRate);
  const total = round2(subtotal - discount + tax);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  const resolvedCustomerId = resolveCustomer({ customerId, customer });

  const orderId = orders.createOrder(
    {
      sessionId: sessionId || null,
      salespersonId: salespersonId || null,
      customerId: resolvedCustomerId,
      status: 'placed',
      itemCount,
      subtotal,
      discount,
      tax,
      total,
      currency,
    },
    lines
  );

  return getOrder(orderId);
}

export function getOrder(orderId) {
  const order = orders.getOrderById(orderId);
  if (!order) throw notFound('Order not found');
  const items = orders.getOrderItems(orderId);
  const customer = order.customerId ? customers.getCustomer(order.customerId) : null;
  return { ...order, items, customer: customer || null };
}
