'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import type { DashboardMetrics } from '@/lib/analytics';

function inr(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card sx={{ flex: 1, minWidth: 160 }}>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sx={{ flex: 1, minWidth: 320 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

const EMPTY = (
  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
    No data yet.
  </Typography>
);

export function DashboardCharts({ metrics }: { metrics: DashboardMetrics }) {
  const { totals, revenue, ordersByDay, revenueByCategory, ordersByStatus, topProducts } = metrics;
  const theme = useTheme();
  const c1 = theme.palette.primary.main;
  const c2 = theme.palette.secondary.main;

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Dashboard</Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <StatCard label="Revenue" value={inr(revenue)} accent />
        <StatCard label="Orders" value={String(totals.orders)} />
        <StatCard label="Products" value={String(totals.products)} />
        <StatCard label="Salespeople" value={String(totals.salespeople)} />
        <StatCard label="Customers" value={String(totals.customers)} />
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <Panel title="Orders & revenue (last 14 days)">
          {ordersByDay.length === 0 ? (
            EMPTY
          ) : (
            <LineChart
              height={280}
              xAxis={[{ data: ordersByDay.map((d) => d.date.slice(5)), scaleType: 'point' }]}
              series={[
                { data: ordersByDay.map((d) => d.orders), label: 'Orders', color: c1 },
                { data: ordersByDay.map((d) => Math.round(d.revenue)), label: 'Revenue (₹)', color: c2 },
              ]}
            />
          )}
        </Panel>

        <Panel title="Orders by status">
          {ordersByStatus.length === 0 ? (
            EMPTY
          ) : (
            <PieChart
              height={280}
              series={[
                {
                  data: ordersByStatus.map((s, i) => ({ id: i, value: s.count, label: s.status })),
                  innerRadius: 40,
                  paddingAngle: 3,
                  cornerRadius: 4,
                },
              ]}
            />
          )}
        </Panel>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <Panel title="Revenue by category">
          {revenueByCategory.length === 0 ? (
            EMPTY
          ) : (
            <BarChart
              height={300}
              xAxis={[{ data: revenueByCategory.map((c) => c.category), scaleType: 'band' }]}
              series={[{ data: revenueByCategory.map((c) => Math.round(c.revenue)), label: 'Revenue (₹)', color: c1 }]}
            />
          )}
        </Panel>

        <Panel title="Top products">
          {topProducts.length === 0 ? (
            EMPTY
          ) : (
            <Stack spacing={1.5}>
              {topProducts.map((p, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ maxWidth: '60%' }} noWrap>
                    {i + 1}. {p.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {p.quantity} sold · {inr(p.revenue)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Panel>
      </Stack>
    </Stack>
  );
}
