import { NextResponse } from 'next/server';
import { listSalespeople } from '@/lib/salespeople';
import { boxPost } from '@/lib/box';

export const runtime = 'nodejs';

// GET /api/salespeople -> salespeople with aggregate stats
export async function GET() {
  return NextResponse.json({ items: await listSalespeople() });
}

// POST /api/salespeople -> create a salesperson account (admin only).
// Registration is disabled in the mobile app; associates are created here and
// sign in with the credentials the admin gives them. Delegates to the box's
// auth register endpoint so the account + password live in the box's DB.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    title?: string;
    username?: string;
    password?: string;
  };
  const name = body.name?.trim();
  const username = body.username?.trim();
  const password = body.password ?? '';
  const title = body.title?.trim();

  if (!name || !username || !password) {
    return NextResponse.json(
      { error: 'Name, username and password are required.' },
      { status: 400 },
    );
  }
  if (username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });
  }

  try {
    const { status, data } = await boxPost<{ salesperson?: unknown; error?: { message?: string } }>(
      '/api/auth/register',
      { name, username, password, ...(title ? { title } : {}) },
    );
    if (status !== 200 && status !== 201) {
      return NextResponse.json(
        { error: data?.error?.message ?? 'Could not create the salesperson.' },
        { status: status || 500 },
      );
    }
    return NextResponse.json({ salesperson: data.salesperson }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the box server to create the account.' },
      { status: 502 },
    );
  }
}
