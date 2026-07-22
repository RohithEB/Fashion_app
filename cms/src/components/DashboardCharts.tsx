'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import type { DashboardMetrics } from '@/lib/analytics';

// A single figure in the top stat line: quiet label, oversized numeral.
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ flex: 1, minWidth: 120, py: { xs: 1.5, sm: 0 } }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: 'block', letterSpacing: 1.5 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 300, fontSize: { xs: 40, sm: 52 }, lineHeight: 1.1 }}>
        {value.toLocaleString('en-IN')}
      </Typography>
    </Box>
  );
}

// A titled block with a thin rule beneath the heading — no card chrome.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ flex: 1, minWidth: 300 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ letterSpacing: 1.5, display: 'block', mb: 1 }}
      >
        {title}
      </Typography>
      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Box>
  );
}

const EMPTY = (
  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
    Nothing to show yet.
  </Typography>
);

export function DashboardCharts({ metrics }: { metrics: DashboardMetrics }) {
  const { totals, ordersByDay, ordersByStatus, topProducts } = metrics;
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  const statusTotal = ordersByStatus.reduce((sum, s) => sum + s.count, 0);
  const maxQty = topProducts.reduce((m, p) => Math.max(m, p.quantity), 0) || 1;

  return (
    <Stack spacing={6} sx={{ maxWidth: 1080, pb: 4 }}>
      {/* Masthead */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Overview
        </Typography>
        <Typography sx={{ fontWeight: 300, fontSize: { xs: 34, sm: 44 }, letterSpacing: -0.5 }}>
          The house at a glance
        </Typography>
      </Box>

      {/* Stat line */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
        spacing={{ xs: 0, sm: 4 }}
      >
        <Stat label="Products" value={totals.products} />
        <Stat label="Salespeople" value={totals.salespeople} />
        <Stat label="Customers" value={totals.customers} />
        <Stat label="Orders" value={totals.orders} />
      </Stack>

      {/* Activity — orders over the last 14 days */}
      <Section title="Order activity · last 14 days">
        {ordersByDay.length === 0 ? (
          EMPTY
        ) : (
          <LineChart
            height={260}
            margin={{ left: 8, right: 8, top: 16, bottom: 24 }}
            grid={{ horizontal: true }}
            xAxis={[
              {
                data: ordersByDay.map((d) => d.date.slice(5)),
                scaleType: 'point',
                disableLine: true,
                disableTicks: true,
              },
            ]}
            yAxis={[{ disableLine: true, disableTicks: true }]}
            series={[
              {
                data: ordersByDay.map((d) => d.orders),
                label: 'Orders',
                color: accent,
                area: true,
                showMark: false,
                curve: 'monotoneX',
              },
            ]}
            slotProps={{ legend: { hidden: true } }}
            sx={{
              '& .MuiAreaElement-root': { fillOpacity: 0.08 },
              '& .MuiChartsAxis-tickLabel': { fill: theme.palette.text.secondary },
              '& .MuiChartsGrid-line': { stroke: theme.palette.divider },
            }}
          />
        )}
      </Section>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 6, lg: 8 }}>
        {/* Orders by status — editorial proportion rows */}
        <Section title="Orders by status">
          {ordersByStatus.length === 0 ? (
            EMPTY
          ) : (
            <Stack spacing={2.5}>
              {ordersByStatus.map((s) => {
                const pct = statusTotal ? (s.count / statusTotal) * 100 : 0;
                return (
                  <Box key={s.status}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {s.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.count}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 2, bgcolor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: accent, borderRadius: 1 }} />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Section>

        {/* Most requested — top products by quantity, no money */}
        <Section title="Most requested">
          {topProducts.length === 0 ? (
            EMPTY
          ) : (
            <Stack spacing={2.5}>
              {topProducts.map((p, i) => (
                <Box key={i}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ maxWidth: '70%' }} noWrap>
                      <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                        {String(i + 1).padStart(2, '0')}
                      </Box>
                      {p.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.quantity} sold
                    </Typography>
                  </Box>
                  <Box sx={{ height: 2, bgcolor: 'divider', borderRadius: 1 }}>
                    <Box
                      sx={{
                        width: `${(p.quantity / maxQty) * 100}%`,
                        height: '100%',
                        bgcolor: accent,
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Section>
      </Stack>
    </Stack>
  );
}
