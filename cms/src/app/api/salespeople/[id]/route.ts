import { NextResponse } from 'next/server';
import { getSalesperson } from '@/lib/salespeople';

export const runtime = 'nodejs';

// GET /api/salespeople/:id -> profile + weekly/monthly insights + recent orders
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getSalesperson(id);
  if (!detail) return NextResponse.json({ error: 'Salesperson not found.' }, { status: 404 });
  return NextResponse.json(detail);
}
