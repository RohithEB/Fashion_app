import { test, expect } from '@playwright/test';

test.describe('Catalog API', () => {
  test('health reports seeded products', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.products).toBeGreaterThanOrEqual(15);
  });

  test('list returns items with hero image + colors', async ({ request }) => {
    const res = await request.get('/api/products?limit=100');
    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(15);
    const p = body.items[0];
    expect(p.id && p.name && p.category).toBeTruthy();
    expect(p.heroImage).toBeTruthy();
    expect(Array.isArray(p.colors) && p.colors.length).toBeGreaterThan(0);
  });

  test('search matches name/category/tags', async ({ request }) => {
    const body = await (await request.get('/api/products?q=dress')).json();
    expect(body.items.length).toBeGreaterThan(0);
    for (const i of body.items) {
      const matches = /dress|skirt|slip/i.test(i.name)
        || i.tags.some((t) => /dress/.test(t))
        || i.category === 'Dresses';
      expect(matches).toBeTruthy();
    }
  });

  test('category filter narrows results', async ({ request }) => {
    const body = await (await request.get('/api/products?category=Footwear')).json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i) => i.category === 'Footwear')).toBeTruthy();
  });

  test('gender filter narrows results', async ({ request }) => {
    const body = await (await request.get('/api/products?gender=women&limit=100')).json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i) => i.gender === 'women')).toBeTruthy();
  });

  test('gender + category combine', async ({ request }) => {
    const body = await (await request.get('/api/products?gender=men&category=T-Shirts')).json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i) => i.gender === 'men' && i.category === 'T-Shirts')).toBeTruthy();
  });

  test('sort by price asc is ordered', async ({ request }) => {
    const body = await (await request.get('/api/products?sort=price&order=asc&limit=100')).json();
    const prices = body.items.map((i) => i.basePrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('price range filter respected', async ({ request }) => {
    const body = await (await request.get('/api/products?minPrice=10000&maxPrice=20000')).json();
    expect(body.items.every((i) => i.basePrice >= 10000 && i.basePrice <= 20000)).toBeTruthy();
  });

  test('product detail has enrichment, variants, media, colors, sizes', async ({ request }) => {
    const list = await (await request.get('/api/products?limit=1')).json();
    const detail = await (await request.get(`/api/products/${list.items[0].id}`)).json();
    expect(detail.enrichment.length).toBeGreaterThan(0);
    expect(detail.variants.length).toBeGreaterThan(0);
    expect(detail.media.length).toBeGreaterThan(0);
    expect(detail.colors.length).toBeGreaterThan(0);
    expect(detail.sizes.length).toBeGreaterThan(0);
  });

  test('unknown product -> 404 with error shape', async ({ request }) => {
    const res = await request.get('/api/products/does-not-exist');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBeTruthy();
  });

  test('categories and filters endpoints', async ({ request }) => {
    const cats = await (await request.get('/api/categories')).json();
    expect(cats.categories.length).toBeGreaterThanOrEqual(5);
    const filters = await (await request.get('/api/filters')).json();
    expect(filters.colors.length).toBeGreaterThan(0);
    expect(filters.sizes.length).toBeGreaterThan(0);
    expect(filters.genders.length).toBeGreaterThanOrEqual(2);
    expect(filters.priceRange.min).toBeLessThanOrEqual(filters.priceRange.max);
  });

  test('similar returns related products excluding self', async ({ request }) => {
    const list = await (await request.get('/api/products?limit=1')).json();
    const id = list.items[0].id;
    const sim = await (await request.get(`/api/products/${id}/similar`)).json();
    expect(sim.items.every((i) => i.id !== id)).toBeTruthy();
  });

  test('placeholder media renders as SVG', async ({ request }) => {
    const res = await request.get('/media/ph?text=Test&bg=1C1C1C&fg=FFFFFF');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('image/svg');
  });
});
