'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import UploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import MovieIcon from '@mui/icons-material/Movie';
import {
import { mediaSrc } from '@/lib/media';
  GENDERS, CATEGORIES, SUBCATEGORIES, STYLE_ARCHETYPES, OCCASIONS, SEASONS, FITS,
  PATTERNS, MATERIALS, VIBES, AGE_GROUPS, type EnrichedProduct,
} from '@/lib/attributes';
import { mediaSrc } from '@/lib/media';

interface FormState {
  name: string; brand: string; category: string; subCategory: string; gender: string;
  basePrice: string; currency: string; rating: string; description: string;
  styleArchetype: string; occasion: string; season: string; fit: string;
  pattern: string; material: string; fabric: string; vibe: string;
  primaryColor: string; ageGroup: string; tags: string; sizes: string;
  colors: string; highlights: string;
}

const EMPTY: FormState = {
  name: '', brand: '', category: '', subCategory: '', gender: 'women', basePrice: '',
  currency: 'INR', rating: '', description: '', styleArchetype: '', occasion: '',
  season: '', fit: '', pattern: '', material: '', fabric: '', vibe: '',
  primaryColor: '', ageGroup: '', tags: '', sizes: 'S:5, M:8, L:5, XL:3', colors: '',
  highlights: '',
};

// A product can carry up to this many media items (images + videos combined).
const MAX_MEDIA = 6;

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

function SelectField(props: {
  label: string; value: string; options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <TextField
      select fullWidth label={props.label} value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    >
      <MenuItem value="">
        <em>—</em>
      </MenuItem>
      {props.options.map((o) => (
        <MenuItem key={o} value={o}>
          {o}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnriched, setAiEnriched] = useState(false);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const images = media.filter((m) => m.type === 'image');
  const videos = media.filter((m) => m.type === 'video');
  const heroImage = images[0]?.url ?? null;

  async function handleUpload(files: FileList) {
    setError(null);
    const room = MAX_MEDIA - media.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_MEDIA} media items.`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);
    if (files.length > room) {
      setError(`Only ${room} more can be added (max ${MAX_MEDIA} total).`);
    }
    setUploading(true);
    try {
      for (const file of chosen) {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Upload failed');
        const type: MediaItem['type'] = file.type.startsWith('video/') ? 'video' : 'image';
        setMedia((m) => (m.length >= MAX_MEDIA ? m : [...m, { url: json.url, type }]));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(url: string) {
    setMedia((m) => m.filter((x) => x.url !== url));
  }

  async function handleEnrich() {
    if (!heroImage) return;
    setError(null);
    setEnriching(true);
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageUrl: heroImage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Enrichment failed');
      const e = json as EnrichedProduct;
      setForm((f) => ({
        ...f,
        name: e.name ?? f.name,
        brand: e.brand ?? f.brand,
        category: e.category ?? f.category,
        subCategory: e.subCategory ?? f.subCategory,
        gender: e.gender ?? f.gender,
        basePrice: e.basePrice ? String(e.basePrice) : f.basePrice,
        rating: e.rating ? String(e.rating) : f.rating,
        description: e.description ?? f.description,
        styleArchetype: e.styleArchetype ?? f.styleArchetype,
        occasion: e.occasion ?? f.occasion,
        season: e.season ?? f.season,
        fit: e.fit ?? f.fit,
        pattern: e.pattern ?? f.pattern,
        material: e.material ?? f.material,
        fabric: e.fabric ?? f.fabric,
        vibe: e.vibe ?? f.vibe,
        primaryColor: e.primaryColor ?? f.primaryColor,
        ageGroup: e.ageGroup ?? f.ageGroup,
        tags: (e.tags || []).join(', '),
        colors: (e.colors || []).join(', '),
        sizes: (e.sizes || []).length ? (e.sizes || []).map((s) => `${s}:5`).join(', ') : f.sizes,
        highlights: (e.highlights || []).join('\n'),
      }));
      setAiEnriched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrichment failed');
    } finally {
      setEnriching(false);
    }
  }

  // "Ivory:#f4f1ea, Charcoal" -> [{color, colorHex?}]
  function parseColors() {
    return form.colors
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((token) => {
        const [name, hex] = token.split(':').map((x) => x.trim());
        return { color: name, colorHex: hex || undefined };
      });
  }

  // "S:5, M:8, L" -> [{size, quantity}]  (missing qty defaults to 0)
  function parseSizes() {
    return form.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((token) => {
        const [size, qty] = token.split(':').map((x) => x.trim());
        return { size, quantity: Number(qty) || 0 };
      });
  }

  async function handleSubmit() {
    setError(null);
    if (!form.name.trim() || !form.category) {
      setError('Name and category are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        category: form.category,
        subCategory: form.subCategory || undefined,
        gender: form.gender,
        basePrice: Number(form.basePrice) || 0,
        currency: form.currency || 'INR',
        rating: form.rating ? Number(form.rating) : undefined,
        description: form.description.trim() || undefined,
        styleArchetype: form.styleArchetype || undefined,
        occasion: form.occasion || undefined,
        season: form.season || undefined,
        fit: form.fit || undefined,
        pattern: form.pattern || undefined,
        material: form.material || undefined,
        fabric: form.fabric.trim() || undefined,
        vibe: form.vibe || undefined,
        primaryColor: form.primaryColor.trim() || undefined,
        ageGroup: form.ageGroup || undefined,
        heroImage: heroImage || undefined,
        mediaUrls: images.slice(1).map((m) => m.url),
        videoUrls: videos.map((m) => m.url),
        aiEnriched,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        sizes: parseSizes(),
        colors: parseColors(),
        highlights: form.highlights.split('\n').map((h) => h.trim()).filter(Boolean),
      };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      router.push('/products');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1100 }}>
      <Typography variant="h4">Add / enrich product</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Media + AI */}
        <Card sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Media</Typography>
              <Typography variant="body2" color="text.secondary">
                {media.length} / {MAX_MEDIA}
              </Typography>
            </Box>

            {media.length === 0 ? (
              <Box
                sx={{
                  width: '100%', aspectRatio: '3 / 4', borderRadius: 2,
                  bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No media yet
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2,
                }}
              >
                {media.map((m, i) => (
                  <Box
                    key={m.url}
                    sx={{
                      position: 'relative', aspectRatio: '1 / 1', borderRadius: 1.5,
                      overflow: 'hidden', border: '1px solid', borderColor: 'divider',
                      bgcolor: 'action.hover',
                    }}
                  >
                    {m.type === 'video' ? (
                      <video
                        src={mediaSrc(m.url)} muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaSrc(m.url)} alt={`media ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    {m.type === 'video' && (
                      <MovieIcon
                        fontSize="small"
                        sx={{ position: 'absolute', top: 4, left: 4, color: '#fff',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
                      />
                    )}
                    {i === 0 && m.type === 'image' && (
                      <Chip
                        label="Hero" size="small" color="primary"
                        sx={{ position: 'absolute', bottom: 4, left: 4, height: 20, fontSize: 11 }}
                      />
                    )}
                    <IconButton
                      size="small" onClick={() => removeMedia(m.url)}
                      sx={{
                        position: 'absolute', top: 2, right: 2, p: 0.25,
                        bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Button
              component="label" variant="outlined" fullWidth startIcon={<UploadIcon />}
              disabled={uploading || media.length >= MAX_MEDIA} sx={{ mb: 1.5 }}
            >
              {uploading
                ? 'Uploading…'
                : media.length >= MAX_MEDIA
                  ? 'Limit reached'
                  : 'Add images / videos'}
              <input
                hidden type="file" accept="image/*,video/*" multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length) handleUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </Button>

            <Button
              variant="contained" fullWidth
              startIcon={enriching ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
              disabled={!heroImage || enriching} onClick={handleEnrich}
            >
              {enriching ? 'Analyzing…' : 'Enrich with AI'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              First image is the hero. Up to {MAX_MEDIA} images/videos. AI analyses the hero image.
            </Typography>
            {aiEnriched && <Chip label="AI enriched" color="primary" size="small" sx={{ mt: 1.5 }} />}
          </CardContent>
        </Card>

        {/* Fields */}
        <Card sx={{ flexGrow: 1 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField fullWidth label="Name" value={form.name} onChange={(e) => set('name')(e.target.value)} />
                <TextField fullWidth label="Brand" value={form.brand} onChange={(e) => set('brand')(e.target.value)} />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <SelectField label="Category" value={form.category} options={CATEGORIES} onChange={set('category')} />
                <SelectField label="Sub-category" value={form.subCategory} options={SUBCATEGORIES} onChange={set('subCategory')} />
                <SelectField label="Gender" value={form.gender} options={GENDERS} onChange={set('gender')} />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth label="Base price" type="number" value={form.basePrice}
                  onChange={(e) => set('basePrice')(e.target.value)}
                />
                <TextField
                  fullWidth label="Rating (0–5)" type="number" value={form.rating}
                  onChange={(e) => set('rating')(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, max: 5, step: 0.1 } }}
                />
                <TextField fullWidth label="Currency" value={form.currency} onChange={(e) => set('currency')(e.target.value)} />
              </Stack>

              <TextField
                fullWidth multiline minRows={2} label="Description"
                value={form.description} onChange={(e) => set('description')(e.target.value)}
              />

              <Typography variant="overline" color="text.secondary">
                Attributes
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <SelectField label="Style archetype" value={form.styleArchetype} options={STYLE_ARCHETYPES} onChange={set('styleArchetype')} />
                <SelectField label="Vibe" value={form.vibe} options={VIBES} onChange={set('vibe')} />
                <SelectField label="Occasion" value={form.occasion} options={OCCASIONS} onChange={set('occasion')} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <SelectField label="Season" value={form.season} options={SEASONS} onChange={set('season')} />
                <SelectField label="Fit" value={form.fit} options={FITS} onChange={set('fit')} />
                <SelectField label="Pattern" value={form.pattern} options={PATTERNS} onChange={set('pattern')} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <SelectField label="Material" value={form.material} options={MATERIALS} onChange={set('material')} />
                <TextField fullWidth label="Fabric" value={form.fabric} onChange={(e) => set('fabric')(e.target.value)} placeholder="e.g. 100% linen" />
                <SelectField label="Age group" value={form.ageGroup} options={AGE_GROUPS} onChange={set('ageGroup')} />
              </Stack>
              <TextField fullWidth label="Primary colour" value={form.primaryColor} onChange={(e) => set('primaryColor')(e.target.value)} />

              <Typography variant="overline" color="text.secondary">
                Variants, stock & display
              </Typography>
              <TextField fullWidth label="Tags (comma separated)" value={form.tags} onChange={(e) => set('tags')(e.target.value)} />
              <TextField
                fullWidth label="Colours (Name or Name:#hex, …)" value={form.colors}
                onChange={(e) => set('colors')(e.target.value)} placeholder="Ivory:#f4f1ea, Charcoal:#333333"
              />
              <TextField
                fullWidth label="Sizes with quantity (Size:qty, …)" value={form.sizes}
                onChange={(e) => set('sizes')(e.target.value)} placeholder="S:5, M:8, L:5, XL:3"
                helperText="Per-size stock. A variant is created for every colour × size."
              />
              <TextField
                fullWidth multiline minRows={3} label="Highlights (one per line)"
                value={form.highlights} onChange={(e) => set('highlights')(e.target.value)}
              />

              <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
                <Button variant="contained" onClick={handleSubmit} disabled={saving} size="large">
                  {saving ? 'Saving…' : 'Save product'}
                </Button>
                <Button
                  variant="text" color="inherit"
                  onClick={() => { setForm(EMPTY); setMedia([]); setAiEnriched(false); }}
                >
                  Reset
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
