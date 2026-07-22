'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { SalespersonRow } from '@/lib/salespeople';

function inr(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

const columns: GridColDef<SalespersonRow>[] = [
  { field: 'name', headerName: 'Associate', flex: 1.2, minWidth: 160 },
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 150, valueGetter: (v) => v || '—' },
  { field: 'username', headerName: 'Username', flex: 0.8, minWidth: 120 },
  { field: 'orders', headerName: 'Orders', type: 'number', width: 100 },
  { field: 'customers', headerName: 'Customers', type: 'number', width: 110 },
  { field: 'itemsSold', headerName: 'Items', type: 'number', width: 90 },
  {
    field: 'revenue', headerName: 'Revenue', type: 'number', width: 140,
    valueFormatter: (v: number) => inr(v || 0),
  },
];

export function SalespeopleGrid({ rows }: { rows: SalespersonRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Usernames already in use, normalized the same way the box does (trim +
  // lowercase) so the live availability check matches the server's uniqueness
  // rule. The list is refreshed after every create via router.refresh().
  const takenUsernames = new Set(rows.map((r) => r.username.trim().toLowerCase()));

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Salespeople</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          New salesperson
        </Button>
      </Box>
      <Card sx={{ height: 560 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          onRowClick={(p) => router.push(`/salespeople/${p.id}`)}
          disableRowSelectionOnClick
          sx={{ border: 0, cursor: 'pointer' }}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
        />
      </Card>
      <NewSalespersonDialog
        open={open}
        takenUsernames={takenUsernames}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </Stack>
  );
}

function NewSalespersonDialog({
  open,
  takenUsernames,
  onClose,
  onCreated,
}: {
  open: boolean;
  takenUsernames: Set<string>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live username availability, normalized to match the box (trim + lowercase).
  const normalized = username.trim().toLowerCase();
  const isTaken = normalized.length >= 3 && takenUsernames.has(normalized);
  const isTooShort = normalized.length > 0 && normalized.length < 3;
  const isAvailable = normalized.length >= 3 && !isTaken;
  const usernameStatus: { text: string; color: 'error.main' | 'success.main' | 'text.secondary' } | null =
    isTaken
      ? { text: '✕ Username is already taken', color: 'error.main' }
      : isTooShort
        ? { text: 'Username must be at least 3 characters', color: 'text.secondary' }
        : isAvailable
          ? { text: '✓ Username is available', color: 'success.main' }
          : null;

  const reset = () => {
    setName('');
    setTitle('');
    setUsername('');
    setPassword('');
    setError(null);
    setBusy(false);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/salespeople', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, title, username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not create the salesperson.');
        setBusy(false);
        return;
      }
      reset();
      onCreated();
    } catch {
      setError('Network error — could not reach the CMS.');
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New salesperson</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Create an associate account. Share the username &amp; password with them — they sign in
            on the controller with these details. There is no self-registration in the app.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus fullWidth />
          <TextField label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Style Advisor" fullWidth />
          <Box>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              error={isTaken}
              fullWidth
            />
            {usernameStatus && (
              <Typography variant="caption" sx={{ color: usernameStatus.color, mt: 0.5, display: 'block' }}>
                {usernameStatus.text}
              </Typography>
            )}
          </Box>
          <TextField label="Password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" fullWidth helperText="Visible so you can copy it for the associate." />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} color="inherit">
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy || isTaken} variant="contained">
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
