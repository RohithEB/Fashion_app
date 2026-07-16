// On-the-fly SVG placeholder images so seeded catalog renders offline with accurate labels.
// The seed builds URLs like /media/ph?...&text=<Product name — Colour>, so each image
// reflects its exact product/variant. Replace with real assets by swapping the seed mediaUrls.
import { Router } from 'express';

const escapeXml = (s = '') =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const hex = (v, fallback) => (/^[0-9a-fA-F]{3,8}$/.test(v || '') ? `#${v}` : fallback);

export const placeholderRouter = Router();

placeholderRouter.get('/ph', (req, res) => {
  const w = Math.min(Number(req.query.w) || 900, 2000);
  const h = Math.min(Number(req.query.h) || 1200, 2000);
  const bg = hex(req.query.bg, '#1C1C1C');
  const fg = hex(req.query.fg, '#FFFFFF');
  const text = escapeXml(String(req.query.text || 'Fashion').slice(0, 80));

  // Wrap the label onto two lines around the mid-point word boundary.
  const words = text.split(' ');
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="${fg}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="50%" y="47%" fill="${fg}" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(w / 16)}" text-anchor="middle">${line1}</text>
  <text x="50%" y="55%" fill="${fg}" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(w / 16)}" text-anchor="middle">${line2}</text>
</svg>`;

  res.set('Content-Type', 'image/svg+xml');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});
