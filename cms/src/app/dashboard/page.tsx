import { getDashboardMetrics } from '@/lib/analytics';
import { DashboardCharts } from '@/components/DashboardCharts';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const metrics = getDashboardMetrics();
  return <DashboardCharts metrics={metrics} />;
}
