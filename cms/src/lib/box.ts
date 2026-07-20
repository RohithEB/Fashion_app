// Box server access for the CMS.
//
// When BOX_API_URL is set, the CMS reads live data from the on-device Node
// server on the Android box (its /api/admin/* read endpoints) instead of opening
// the local SQLite file. Unset -> local file mode (CMS co-located with the server,
// e.g. dev). This is the "view-only against the box" path.
export function boxApiUrl(): string | null {
  const raw = process.env.BOX_API_URL?.trim();
  return raw ? raw.replace(/\/+$/, '') : null;
}

/** Fetch JSON from the box admin API. Throws on any non-2xx. */
export async function boxFetch<T>(path: string): Promise<T> {
  const base = boxApiUrl();
  if (!base) throw new Error('BOX_API_URL not set');
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Box API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Like boxFetch but returns null on 404 (not-found), throws on other errors. */
export async function boxFetchOrNull<T>(path: string): Promise<T | null> {
  const base = boxApiUrl();
  if (!base) throw new Error('BOX_API_URL not set');
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Box API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** POST JSON to the box; returns the box's status + parsed body (no throw on non-2xx). */
export async function boxPost<T>(path: string, body: unknown): Promise<{ status: number; data: T }> {
  const base = boxApiUrl();
  if (!base) throw new Error('BOX_API_URL not set');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = (await res.json()) as T;
  return { status: res.status, data };
}

/** POST raw bytes (a media upload) to the box; returns status + parsed body. */
export async function boxUpload<T>(
  path: string,
  bytes: Buffer | Uint8Array,
  contentType: string,
): Promise<{ status: number; data: T }> {
  const base = boxApiUrl();
  if (!base) throw new Error('BOX_API_URL not set');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: bytes as BodyInit,
    cache: 'no-store',
  });
  const data = (await res.json()) as T;
  return { status: res.status, data };
}
