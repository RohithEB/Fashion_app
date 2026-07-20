'use client';

import { useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import type { SalespersonDetail } from '@/lib/salespeople';
import { ActivityLogDialog } from './ActivityLogDialog';

function inr(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card sx={{ flex: 1, minWidth: 150 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5, color: accent ? 'primary.main' : 'text.primary' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

const EMPTY = (
  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
    No sales recorded yet.
  </Typography>
);

export function SalespersonDetailView({ detail }: { detail: SalespersonDetail }) {
  const { profile, weekly, monthly, recentOrders, strategy, journey } = detail;
  const [logOpen, setLogOpen] = useState(false);
  const theme = useTheme();
  const c1 = theme.palette.primary.main;
  const c2 = theme.palette.secondary.main;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Button component={Link} href="/salespeople" startIcon={<ArrowBackIcon />} color="inherit" size="small">
            All salespeople
          </Button>
          <Typography variant="h4" sx={{ mt: 1 }}>
            {profile.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.title || 'Studio Associate'} · @{profile.username}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setLogOpen(true)}
          sx={{ mt: 1 }}
        >
          View activity log
        </Button>
      </Box>

      <ActivityLogDialog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        journey={journey}
        name={profile.name}
      />

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <StatCard label="Revenue" value={inr(profile.revenue)} accent />
        <StatCard label="Orders" value={String(profile.orders)} />
        <StatCard label="Customers" value={String(profile.customers)} />
        <StatCard label="Items sold" value={String(profile.itemsSold)} />
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <Card sx={{ flex: 1, minWidth: 320 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Weekly insights
            </Typography>
            {weekly.length === 0 ? (
              EMPTY
            ) : (
              <BarChart
                height={260}
                width={Math.min(560, 120 + weekly.length * 96)}
                xAxis={[{ data: weekly.map((w) => w.week), scaleType: 'band' }]}
                series={[
                  { data: weekly.map((w) => w.orders), label: 'Orders', color: c1 },
                  { data: weekly.map((w) => Math.round(w.revenue)), label: 'Revenue (₹)', color: c2 },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 320 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Monthly insights
            </Typography>
            {monthly.length === 0 ? (
              EMPTY
            ) : (
              <BarChart
                height={260}
                width={Math.min(560, 120 + monthly.length * 96)}
                xAxis={[{ data: monthly.map((m) => m.month), scaleType: 'band' }]}
                series={[
                  { data: monthly.map((m) => m.orders), label: 'Orders', color: c1 },
                  { data: monthly.map((m) => Math.round(m.revenue)), label: 'Revenue (₹)', color: c2 },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Sales strategy — what they showed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Every product this associate put on the screen, and how often it converted —
            the record of their pitch so others can learn from it.
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <StatCard label="Products shown" value={String(strategy.presentations)} />
            <StatCard label="Unique pieces" value={String(strategy.uniqueShown)} />
            <StatCard
              label="Show → sell"
              value={`${Math.round(strategy.conversionRate * 100)}%`}
              accent
            />
          </Stack>
          {strategy.topShown.length === 0 ? (
            EMPTY
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Most-shown product</TableCell>
                  <TableCell align="center">Times shown</TableCell>
                  <TableCell align="center">Ordered</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {strategy.topShown.map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell align="center">{p.shown}</TableCell>
                    <TableCell align="center">
                      {p.ordered > 0 ? (
                        <Chip label={`${p.ordered}`} color="success" size="small" />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Recent orders
          </Typography>
        </CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
            {recentOrders.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{o.id}</TableCell>
                <TableCell>{o.customerName || '—'}</TableCell>
                <TableCell align="center">{o.itemCount}</TableCell>
                <TableCell>
                  <Chip label={o.status} size="small" />
                </TableCell>
                <TableCell>{o.createdAt.slice(0, 10)}</TableCell>
                <TableCell align="right">{inr(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );
}
