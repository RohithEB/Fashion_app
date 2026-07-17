import { NextResponse } from 'next/server';
import { enrichFromImage } from '@/lib/ai';
import { aiConfigured } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/enrich  { imageUrl }  -> EnrichedProduct (AI-analyzed catalog metadata)
export async function POST(req: Request) {
  if (!aiConfigured()) {
    return NextResponse.json({ error: 'AI is not configured — set ANTHROPIC_API_KEY.' }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { imageUrl?: string };
    if (!body.imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required.' }, { status: 400 });
    }
    const enriched = await enrichFromImage(body.imageUrl);
    return NextResponse.json(enriched);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enrichment failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
