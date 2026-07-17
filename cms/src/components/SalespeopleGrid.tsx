'use client';

import { useRouter } from 'next/navigation';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
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
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Salespeople</Typography>
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
    </Stack>
  );
}
