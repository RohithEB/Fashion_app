import { NextResponse } from 'next/server';
import { createProduct, listProducts, type ProductInput } from '@/lib/products';
import { boxApiUrl, boxPost } from '@/lib/box';

export const runtime = 'nodejs';

// GET /api/products -> recent products
export async function GET() {
  return NextResponse.json({ items: await listProducts() });
}

// POST /api/products  (ProductInput) -> { id }
// In box mode the create is forwarded to the box so it lands in the live catalog
// the apps read; otherwise it writes to the local DB (co-located dev).
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductInput;
    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'name and category are required.' }, { status: 400 });
    }
    if (boxApiUrl()) {
      const { status, data } = await boxPost<unknown>('/api/admin/products', body);
      return NextResponse.json(data, { status });
    }
    const id = createProduct(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
