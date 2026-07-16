// Cart business rules: add/increment, quantity, remove (+default promotion), set default, clear.
import * as cart from '../repositories/cart.repo.js';
import * as products from '../repositories/products.repo.js';
import { badRequest, notFound } from '../util/errors.js';

// Shape the cart for the API: items enriched with product/variant info + totals + defaultItemId.
export function getCart(sessionId, { customerId = null } = {}) {
  const c = cart.getOrCreateCart(sessionId, customerId);
  const rows = cart.listItems(c.id);

  let subtotal = 0;
  let count = 0;
  let defaultItemId = null;

  const items = rows.map((row) => {
    const product = products.getProductById(row.productId);
    const variant = row.variantId
      ? products.getVariants(row.productId).find((v) => v.id === row.variantId) || null
      : null;
    const unitPrice = product?.basePrice ?? 0;
    subtotal += unitPrice * row.quantity;
    count += row.quantity;
    if (row.isDefault) defaultItemId = row.id;

    return {
      itemId: row.id,
      productId: row.productId,
      variantId: row.variantId,
      quantity: row.quantity,
      isDefault: !!row.isDefault,
      unitPrice,
      lineTotal: unitPrice * row.quantity,
      product: product && {
        id: product.id, name: product.name, brand: product.brand,
        category: product.category, currency: product.currency,
      },
      variant: variant && {
        id: variant.id, size: variant.size, color: variant.color,
        colorHex: variant.colorHex, mediaUrl: variant.mediaUrl,
      },
    };
  });

  return {
    sessionId,
    cartId: c.id,
    customerId: c.customerId,
    items,
    count,
    distinctItems: items.length,
    subtotal,
    currency: items[0]?.product?.currency || 'INR',
    defaultItemId,
  };
}

export function addItem(sessionId, { productId, variantId = null, quantity = 1 } = {}) {
  if (!productId) throw badRequest('productId is required');
  const product = products.getProductById(productId);
  if (!product) throw notFound('Product not found');

  if (variantId) {
    const belongs = products.getVariants(productId).some((v) => v.id === variantId);
    if (!belongs) throw badRequest('variantId does not belong to this product');
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const c = cart.getOrCreateCart(sessionId);
  const existing = cart.findItem(c.id, productId, variantId);

  if (existing) {
    cart.updateItemQuantity(existing.id, existing.quantity + qty);
  } else {
    const isFirst = cart.countItems(c.id) === 0; // first item becomes the default on-screen product
    cart.insertItem(c.id, productId, variantId, qty, isFirst);
  }
  return getCart(sessionId);
}

export function updateQuantity(sessionId, itemId, quantity) {
  const c = requireCart(sessionId);
  const item = requireItem(c.id, itemId);
  const qty = Number(quantity);
  if (Number.isNaN(qty)) throw badRequest('quantity must be a number');

  if (qty <= 0) {
    removeItemInternal(c.id, item);
  } else {
    cart.updateItemQuantity(item.id, qty);
  }
  return getCart(sessionId);
}

export function removeItem(sessionId, itemId) {
  const c = requireCart(sessionId);
  const item = requireItem(c.id, itemId);
  removeItemInternal(c.id, item);
  return getCart(sessionId);
}

export function setDefaultItem(sessionId, itemId) {
  const c = requireCart(sessionId);
  requireItem(c.id, itemId);
  cart.setDefault(itemId);
  return getCart(sessionId);
}

export function clearCart(sessionId) {
  const c = cart.getCartBySession(sessionId);
  if (c) cart.clearItems(c.id);
  return getCart(sessionId);
}

// ─── internals ─────────────────────────────────────────────────────
function requireCart(sessionId) {
  const c = cart.getCartBySession(sessionId);
  if (!c) throw notFound('Cart not found for session');
  return c;
}

function requireItem(cartId, itemId) {
  const item = cart.getItem(itemId);
  if (!item || item.cartId !== cartId) throw notFound('Cart item not found');
  return item;
}

// Remove an item; if it was the default, promote the oldest remaining item to default.
function removeItemInternal(cartId, item) {
  cart.deleteItem(item.id);
  if (item.isDefault) {
    const remaining = cart.listItems(cartId);
    if (remaining.length) cart.setDefault(remaining[0].id);
  }
}
