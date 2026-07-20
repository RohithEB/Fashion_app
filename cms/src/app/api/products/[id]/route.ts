import { NextResponse } from 'next/server';
import { getProductDetail } from '@/lib/products';

// Full product detail (media + variants + enrichment) for the row-click popup.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await getProductDetail(id);
  if (!detail) {
    return NextResponse.json({ error: { message: 'Product not found' } }, { status: 404 });
  }
  return NextResponse.json(detail);
}
