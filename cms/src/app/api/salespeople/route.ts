import { NextResponse } from 'next/server';
import { listSalespeople } from '@/lib/salespeople';

export const runtime = 'nodejs';

// GET /api/salespeople -> salespeople with aggregate stats
export async function GET() {
  return NextResponse.json({ items: await listSalespeople() });
}
