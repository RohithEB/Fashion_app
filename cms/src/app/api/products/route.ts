import { NextResponse } from 'next/server';
import { createProduct, listProducts, type ProductInput } from '@/lib/products';

export const runtime = 'nodejs';

// GET /api/products -> recent products
export async function GET() {
  return NextResponse.json({ items: listProducts() });
}

// POST /api/products  (ProductInput) -> { id }
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductInput;
    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'name and category are required.' }, { status: 400 });
    }
    const id = createProduct(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
