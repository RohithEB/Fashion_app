import { notFound } from 'next/navigation';
import { getSalesperson } from '@/lib/salespeople';
import { SalespersonDetailView } from '@/components/SalespersonDetailView';

export const dynamic = 'force-dynamic';

export default async function SalespersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getSalesperson(id);
  if (!detail) notFound();
  return <SalespersonDetailView detail={detail} />;
}
