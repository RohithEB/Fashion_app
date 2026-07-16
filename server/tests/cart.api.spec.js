import { test, expect } from '@playwright/test';

// One shared session id for the whole cart lifecycle; tests run serially in order.
const SID = 'sess_cart_e2e';

test.describe.configure({ mode: 'serial' });

test.describe('Cart API', () => {
  let productIds;

  test.beforeAll(async ({ request }) => {
    const list = await (await request.get('/api/products?limit=3')).json();
    productIds = list.items.map((i) => i.id);
  });

  test('empty cart for a fresh session', async ({ request }) => {
    const cart = await (await request.get(`/api/cart/${SID}`)).json();
    expect(cart.count).toBe(0);
    expect(cart.items.length).toBe(0);
  });

  test('first added item becomes the default', async ({ request }) => {
    const cart = await (await request.post(`/api/cart/${SID}/items`, {
      data: { productId: productIds[0] },
    })).json();
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].isDefault).toBe(true);
    expect(cart.defaultItemId).toBe(cart.items[0].itemId);
  });

  test('adding same product increments quantity', async ({ request }) => {
    const cart = await (await request.post(`/api/cart/${SID}/items`, {
      data: { productId: productIds[0], quantity: 2 },
    })).json();
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(3);
  });

  test('adding a second product creates a new line', async ({ request }) => {
    const cart = await (await request.post(`/api/cart/${SID}/items`, {
      data: { productId: productIds[1] },
    })).json();
    expect(cart.items.length).toBe(2);
    expect(cart.count).toBe(4);
  });

  test('quantity change updates line and subtotal', async ({ request }) => {
    let cart = await (await request.get(`/api/cart/${SID}`)).json();
    const item = cart.items.find((i) => i.productId === productIds[1]);
    cart = await (await request.patch(`/api/cart/${SID}/items/${item.itemId}`, {
      data: { quantity: 5 },
    })).json();
    const updated = cart.items.find((i) => i.itemId === item.itemId);
    expect(updated.quantity).toBe(5);
    expect(cart.subtotal).toBe(cart.items.reduce((s, i) => s + i.lineTotal, 0));
  });

  test('quantity 0 removes the item', async ({ request }) => {
    let cart = await (await request.get(`/api/cart/${SID}`)).json();
    const item = cart.items.find((i) => i.productId === productIds[1]);
    cart = await (await request.patch(`/api/cart/${SID}/items/${item.itemId}`, {
      data: { quantity: 0 },
    })).json();
    expect(cart.items.find((i) => i.itemId === item.itemId)).toBeUndefined();
  });

  test('set default switches the on-screen item', async ({ request }) => {
    await request.post(`/api/cart/${SID}/items`, { data: { productId: productIds[2] } });
    let cart = await (await request.get(`/api/cart/${SID}`)).json();
    const target = cart.items.find((i) => i.productId === productIds[2]);
    cart = await (await request.put(`/api/cart/${SID}/default`, {
      data: { itemId: target.itemId },
    })).json();
    expect(cart.defaultItemId).toBe(target.itemId);
  });

  test('removing the default promotes another item', async ({ request }) => {
    let cart = await (await request.get(`/api/cart/${SID}`)).json();
    const def = cart.items.find((i) => i.isDefault);
    cart = await (await request.delete(`/api/cart/${SID}/items/${def.itemId}`)).json();
    if (cart.items.length > 0) {
      expect(cart.defaultItemId).toBeTruthy();
      expect(cart.defaultItemId).not.toBe(def.itemId);
    }
  });

  test('variant not belonging to product -> 400', async ({ request }) => {
    const res = await request.post(`/api/cart/${SID}/items`, {
      data: { productId: productIds[0], variantId: 'var_bogus' },
    });
    expect(res.status()).toBe(400);
  });

  test('clear empties the cart', async ({ request }) => {
    const cart = await (await request.delete(`/api/cart/${SID}`)).json();
    expect(cart.items.length).toBe(0);
    expect(cart.count).toBe(0);
  });
});

test.describe('Customer capture', () => {
  test('creates a customer with all fields optional', async ({ request }) => {
    const empty = await request.post('/api/customers', { data: {} });
    expect(empty.status()).toBe(201);
    const c1 = await empty.json();
    expect(c1.id).toBeTruthy();

    const full = await (await request.post('/api/customers', {
      data: { name: 'Asha', mobile: '9999999999', gender: 'F', age: 29 },
    })).json();
    expect(full.name).toBe('Asha');
    expect(full.mobile).toBe('9999999999');
    expect(full.age).toBe(29);
  });
});
