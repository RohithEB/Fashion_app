import { getDashboardMetrics } from '@/lib/analytics';
import { DashboardCharts } from '@/components/DashboardCharts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  return <DashboardCharts metrics={metrics} />;
}
