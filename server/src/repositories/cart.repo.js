// Server-side cart, one per session. Low-level rows only; rules live in cart.service.
import { getDb } from '../db/index.js';
import { uuid, nowIso } from '../util/ids.js';

export function getOrCreateCart(sessionId, customerId = null) {
  const db = getDb();
  let cart = db.prepare('SELECT * FROM carts WHERE sessionId = ?').get(sessionId);
  if (!cart) {
    const id = uuid();
    db.prepare('INSERT INTO carts (id, sessionId, customerId, createdAt) VALUES (?, ?, ?, ?)')
      .run(id, sessionId, customerId, nowIso());
    cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(id);
  } else if (customerId && !cart.customerId) {
    db.prepare('UPDATE carts SET customerId = ? WHERE id = ?').run(customerId, cart.id);
    cart.customerId = customerId;
  }
  return cart;
}

export function getCartBySession(sessionId) {
  return getDb().prepare('SELECT * FROM carts WHERE sessionId = ?').get(sessionId);
}

export function listItems(cartId) {
  return getDb().prepare('SELECT * FROM cart_items WHERE cartId = ? ORDER BY addedAt ASC').all(cartId);
}

export function findItem(cartId, productId, variantId = null) {
  return getDb().prepare(
    `SELECT * FROM cart_items WHERE cartId = ? AND productId = ?
     AND ((variantId IS NULL AND ? IS NULL) OR variantId = ?)`
  ).get(cartId, productId, variantId, variantId);
}

export function getItem(itemId) {
  return getDb().prepare('SELECT * FROM cart_items WHERE id = ?').get(itemId);
}

export function insertItem(cartId, productId, variantId, quantity, isDefault) {
  const id = uuid();
  getDb().prepare(
    `INSERT INTO cart_items (id, cartId, productId, variantId, quantity, isDefault, addedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, cartId, productId, variantId, quantity, isDefault ? 1 : 0, nowIso());
  return getItem(id);
}

export function updateItemQuantity(itemId, quantity) {
  getDb().prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, itemId);
  return getItem(itemId);
}

export function deleteItem(itemId) {
  getDb().prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
}

export function clearItems(cartId) {
  getDb().prepare('DELETE FROM cart_items WHERE cartId = ?').run(cartId);
}

export function clearDefault(cartId) {
  getDb().prepare('UPDATE cart_items SET isDefault = 0 WHERE cartId = ?').run(cartId);
}

export function setDefault(itemId) {
  const item = getItem(itemId);
  if (!item) return null;
  clearDefault(item.cartId);
  getDb().prepare('UPDATE cart_items SET isDefault = 1 WHERE id = ?').run(itemId);
  return getItem(itemId);
}

export function countItems(cartId) {
  return getDb().prepare('SELECT COUNT(*) AS n FROM cart_items WHERE cartId = ?').get(cartId).n;
}
