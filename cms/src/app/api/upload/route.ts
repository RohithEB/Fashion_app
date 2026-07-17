import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';
import { r2Configured } from '@/lib/config';

export const runtime = 'nodejs';

// POST /api/upload  (multipart form-data, field "file") -> { url, key, contentType, size }
export async function POST(req: Request) {
  if (!r2Configured()) {
    return NextResponse.json({ error: 'R2 storage is not configured.' }, { status: 503 });
  }
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing "file" in form data.' }, { status: 400 });
    }
    const contentType = file.type || 'application/octet-stream';
    if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
      return NextResponse.json({ error: 'Only image/video uploads are allowed.' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToR2(buffer, contentType);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
