// Resolve a media path for rendering in the browser.
//
// The showcase server owns `/media/*` and, in the box-as-server deployment, runs
// on the box rather than this machine — so a relative path must be prefixed with
// the box's origin, not localhost. This runs in client components, so the value
// has to be a NEXT_PUBLIC_* variable (BOX_API_URL is server-only).
//
// Absolute URLs (e.g. R2) are passed through untouched.
const ORIGIN = (
  process.env.NEXT_PUBLIC_BOX_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export function mediaSrc(u: string | null | undefined): string {
  if (!u) return '';
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  return `${ORIGIN}${u.startsWith('/') ? '' : '/'}${u}`;
}

export const mediaOrigin = ORIGIN;
