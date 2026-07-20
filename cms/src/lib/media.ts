// Resolve a media path for display in the browser.
// Absolute (http/R2) URLs pass through; relative /media/* paths are served by
// the box in box mode (NEXT_PUBLIC_BOX_API_URL) or a co-located Node server
// (localhost:3000) otherwise. Shared by every CMS component that renders media.
const MEDIA_BASE = (process.env.NEXT_PUBLIC_BOX_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export function mediaSrc(u: string | null | undefined): string {
  if (!u) return '';
  return u.startsWith('http') ? u : `${MEDIA_BASE}${u}`;
}
