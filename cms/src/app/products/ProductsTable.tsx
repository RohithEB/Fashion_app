'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import type { ProductRow } from '@/lib/products';
import { mediaSrc } from '@/lib/media';

function money(n: number): string {
  return Math.round(n).toLocaleString('en-IN');
}

interface Detail extends ProductRow {
  description: string | null;
  tags: string[];
  media: Array<{ id: string; type: string; url: string; posterUrl: string | null; label: string | null }>;
  variants: Array<{ id: string; size: string | null; color: string | null; colorHex: string | null; stock: number }>;
  enrichment: Array<{ key: string; value: string | null }>;
}

export default function ProductsTable({ products }: { products: ProductRow[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);

  async function openRow(id: string) {
    setOpen(true);
    setLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) setDetail((await res.json()) as Detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Style</TableCell>
              <TableCell align="right">Base Price</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="center">AI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No products yet — add your first one.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow
                key={p.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => openRow(p.id)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 44, height: 56, borderRadius: 1, overflow: 'hidden',
                        bgcolor: 'action.hover', flexShrink: 0,
                      }}
                    >
                      {p.heroImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaSrc(p.heroImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                      {p.brand && (
                        <Typography variant="caption" color="text.secondary">{p.brand}</Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{p.gender}</TableCell>
                <TableCell>{p.styleArchetype || '—'}</TableCell>
                <TableCell align="right">{money(p.basePrice)}</TableCell>
                <TableCell>{p.currency}</TableCell>
                <TableCell align="center">
                  {p.aiEnriched ? <Chip label="AI" color="primary" size="small" /> : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth scroll="body">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {detail?.name || 'Product'}
          <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          )}
          {!loading && detail && (
            <Stack spacing={2.5}>
              {/* Images */}
              {detail.media.filter((m) => m.type === 'image').length > 0 && (
                <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                  {detail.media.filter((m) => m.type === 'image').map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.id}
                      src={mediaSrc(m.url)}
                      alt={m.label || ''}
                      style={{ height: 260, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                  ))}
                </Box>
              )}
              {detail.media.filter((m) => m.type === 'video').map((m) => (
                <video key={m.id} src={mediaSrc(m.url)} poster={mediaSrc(m.posterUrl)} controls style={{ width: '100%', maxHeight: 340, borderRadius: 8, background: '#000' }} />
              ))}

              {/* Core info */}
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Info label="Brand" value={detail.brand || '—'} />
                <Info label="Category" value={`${detail.category}${detail.subCategory ? ' · ' + detail.subCategory : ''}`} />
                <Info label="Gender" value={detail.gender} />
                <Info label="Base Price" value={money(detail.basePrice)} />
                <Info label="Currency" value={detail.currency} />
                <Info label="Style" value={detail.styleArchetype || '—'} />
                <Info label="Rating" value={detail.rating != null ? `${detail.rating} / 5` : '—'} />
                <Info label="AI enriched" value={detail.aiEnriched ? 'Yes' : 'No'} />
              </Stack>

              {detail.description && (
                <Box>
                  <Typography variant="overline" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{detail.description}</Typography>
                </Box>
              )}

              {detail.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {detail.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                </Box>
              )}

              {/* Colours */}
              {detail.variants.length > 0 && (
                <Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="overline" color="text.secondary">Colours & sizes</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    {dedupeVariants(detail.variants).map((v) => (
                      <Chip
                        key={v.id}
                        avatar={v.colorHex ? <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: v.colorHex, m: 0.5 }} /> : undefined}
                        label={`${v.color || '—'}${v.sizes.length ? ' · ' + v.sizes.join('/') : ''}  (stock ${v.stock})`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Enrichment */}
              {detail.enrichment.length > 0 && (
                <Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="overline" color="text.secondary">Enrichment</Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {detail.enrichment.map((e, i) => (
                      <Typography key={i} variant="body2">
                        <b>{e.key}:</b> {e.value}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: label === 'Gender' ? 'capitalize' : 'none' }}>{value}</Typography>
    </Box>
  );
}

// Group variants by colour, collecting sizes + total stock.
function dedupeVariants(
  variants: Detail['variants'],
): Array<{ id: string; color: string | null; colorHex: string | null; sizes: string[]; stock: number }> {
  const byColor = new Map<string, { id: string; color: string | null; colorHex: string | null; sizes: string[]; stock: number }>();
  for (const v of variants) {
    const key = v.color || '—';
    const g = byColor.get(key) || { id: v.id, color: v.color, colorHex: v.colorHex, sizes: [], stock: 0 };
    if (v.size && !g.sizes.includes(v.size)) g.sizes.push(v.size);
    g.stock += v.stock;
    byColor.set(key, g);
  }
  return [...byColor.values()];
}
