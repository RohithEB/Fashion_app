import { listSalespeople } from '@/lib/salespeople';
import { SalespeopleGrid } from '@/components/SalespeopleGrid';

export const dynamic = 'force-dynamic';

export default function SalespeoplePage() {
  return <SalespeopleGrid rows={listSalespeople()} />;
}
