import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/analytics';

export const runtime = 'nodejs';

// GET /api/analytics -> dashboard metrics
export async function GET() {
  return NextResponse.json(await getDashboardMetrics());
}
