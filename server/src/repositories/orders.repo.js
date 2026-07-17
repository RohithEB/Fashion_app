// Data access for checkout orders + line snapshots. Pure SQL.
import { getDb } from '../db/index.js';
import { prefixId, nowIso } from '../util/ids.js';

// Persist an order and its priced lines in one transaction. Returns the order id.
export function createOrder(order, items) {
  const db = getDb();
  const id = prefixId('order');
  const createdAt = nowIso();

  const insertOrder = db.prepare(
    `INSERT INTO orders
       (id, sessionId, salespersonId, customerId, status, itemCount,
        subtotal, discount, tax, total, currency, createdAt)
     VALUES
       (@id, @sessionId, @salespersonId, @customerId, @status, @itemCount,
        @subtotal, @discount, @tax, @total, @currency, @createdAt)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items
       (id, orderId, productId, variantId, name, color, size, unitPrice, quantity, lineTotal)
     VALUES
       (@id, @orderId, @productId, @variantId, @name, @color, @size, @unitPrice, @quantity, @lineTotal)`
  );

  const tx = db.transaction(() => {
    insertOrder.run({
      id,
      sessionId: order.sessionId ?? null,
      salespersonId: order.salespersonId ?? null,
      customerId: order.customerId ?? null,
      status: order.status ?? 'placed',
      itemCount: order.itemCount ?? 0,
      subtotal: order.subtotal ?? 0,
      discount: order.discount ?? 0,
      tax: order.tax ?? 0,
      total: order.total ?? 0,
      currency: order.currency ?? 'INR',
      createdAt,
    });
    for (const it of items) {
      insertItem.run({
        id: prefixId('oitem'),
        orderId: id,
        productId: it.productId,
        variantId: it.variantId ?? null,
        name: it.name ?? null,
        color: it.color ?? null,
        size: it.size ?? null,
        unitPrice: it.unitPrice ?? 0,
        quantity: it.quantity ?? 1,
        lineTotal: it.lineTotal ?? 0,
      });
    }
  });
  tx();
  return id;
}

export function getOrderById(id) {
  return getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

export function getOrderItems(orderId) {
  return getDb().prepare(
    'SELECT * FROM order_items WHERE orderId = ? ORDER BY rowid ASC'
  ).all(orderId);
}
