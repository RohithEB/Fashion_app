import { getDb } from './db';
import { boxApiUrl, boxFetch, boxFetchOrNull } from './box';

function tableExists(name: string): boolean {
  return Boolean(
    getDb().prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name),
  );
}

export interface SalespersonRow {
  id: string;
  name: string;
  title: string | null;
  username: string;
  createdAt: string;
  orders: number;
  customers: number;
  itemsSold: number;
  revenue: number;
}

// One row per salesperson with aggregate sales stats (orders/customers/items/revenue).
export async function listSalespeople(): Promise<SalespersonRow[]> {
  if (boxApiUrl()) {
    return (await boxFetch<{ items: SalespersonRow[] }>('/api/admin/salespeople')).items;
  }
  if (!tableExists('salespeople')) return [];
  const hasOrders = tableExists('orders');
  const orderAgg = hasOrders
    ? `(SELECT COUNT(*) FROM orders o WHERE o.salespersonId = s.id) AS orders,
       (SELECT COUNT(DISTINCT o.customerId) FROM orders o WHERE o.salespersonId = s.id AND o.customerId IS NOT NULL) AS customers,
       (SELECT COALESCE(SUM(o.itemCount),0) FROM orders o WHERE o.salespersonId = s.id) AS itemsSold,
       (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.salespersonId = s.id) AS revenue`
    : '0 AS orders, 0 AS customers, 0 AS itemsSold, 0 AS revenue';

  return getDb()
    .prepare(
      `SELECT s.id, s.name, s.title, s.username, s.createdAt, ${orderAgg}
       FROM salespeople s ORDER BY revenue DESC, s.createdAt DESC`,
    )
    .all() as SalespersonRow[];
}

export interface SalespersonDetail {
  profile: SalespersonRow;
  weekly: Array<{ week: string; orders: number; revenue: number }>;
  monthly: Array<{ month: string; orders: number; revenue: number }>;
  recentOrders: Array<{
    id: string; total: number; itemCount: number; status: string;
    customerName: string | null; createdAt: string;
  }>;
  // Sales strategy — what this associate showed customers and how it converted.
  strategy: {
    presentations: number;      // total products shown on-screen
    uniqueShown: number;        // distinct products shown
    conversionRate: number;     // shown products that ended up ordered (0–1)
    topShown: Array<{ name: string; shown: number; ordered: number }>;
  };
  // Full activity log — the associate's step-by-step journey (for the popup).
  journey: JourneyEvent[];
}

export interface JourneyEvent {
  id: string;
  ts: string;
  sessionId: string | null;
  eventType: string;
  refId: string | null;
  name: string | null; // resolved product name when refId is a product
  meta: string | null;
}

export function getSalespersonJourney(id: string, limit = 500): JourneyEvent[] {
  if (!tableExists('journey_events')) return [];
  return getDb()
    .prepare(
      `SELECT je.id, je.ts, je.sessionId, je.eventType, je.refId, je.meta, p.name AS name
       FROM journey_events je LEFT JOIN products p ON p.id = je.refId
       WHERE je.salespersonId = ? ORDER BY je.ts DESC LIMIT ?`,
    )
    .all(id, limit) as JourneyEvent[];
}

const EMPTY_STRATEGY: SalespersonDetail['strategy'] = {
  presentations: 0, uniqueShown: 0, conversionRate: 0, topShown: [],
};

function salesStrategy(id: string): SalespersonDetail['strategy'] {
  if (!tableExists('journey_events')) return EMPTY_STRATEGY;
  const db = getDb();
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS presentations, COUNT(DISTINCT refId) AS uniqueShown
       FROM journey_events WHERE salespersonId = ? AND eventType = 'product_shown'`,
    )
    .get(id) as { presentations: number; uniqueShown: number };

  const hasOrders = tableExists('orders') && tableExists('order_items');
  const orderedSub = hasOrders
    ? `(SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.orderId
         WHERE o.salespersonId = @id AND oi.productId = je.refId)`
    : '0';

  const topShown = db
    .prepare(
      `SELECT COALESCE(p.name, je.refId) AS name, COUNT(*) AS shown, ${orderedSub} AS ordered
       FROM journey_events je LEFT JOIN products p ON p.id = je.refId
       WHERE je.salespersonId = @id AND je.eventType = 'product_shown'
       GROUP BY je.refId ORDER BY shown DESC LIMIT 10`,
    )
    .all({ id }) as Array<{ name: string; shown: number; ordered: number }>;

  const converted = topShown.filter((r) => r.ordered > 0).length;
  const conversionRate = topShown.length ? converted / topShown.length : 0;

  return {
    presentations: totals.presentations,
    uniqueShown: totals.uniqueShown,
    conversionRate,
    topShown,
  };
}

export async function getSalesperson(id: string): Promise<SalespersonDetail | null> {
  if (boxApiUrl()) return boxFetchOrNull<SalespersonDetail>(`/api/admin/salespeople/${id}`);

  if (!tableExists('salespeople')) return null;
  const row = (await listSalespeople()).find((s) => s.id === id);
  if (!row) {
    const base = getDb().prepare('SELECT * FROM salespeople WHERE id = ?').get(id) as
      | { id: string; name: string; title: string | null; username: string; createdAt: string }
      | undefined;
    if (!base) return null;
    return {
      profile: { ...base, orders: 0, customers: 0, itemsSold: 0, revenue: 0 },
      weekly: [], monthly: [], recentOrders: [],
      strategy: salesStrategy(id), journey: getSalespersonJourney(id),
    };
  }

  const db = getDb();
  const hasOrders = tableExists('orders');

  const weekly = hasOrders
    ? (db
        .prepare(
          `SELECT strftime('%Y-W%W', createdAt) AS week, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
           FROM orders WHERE salespersonId = ? GROUP BY week ORDER BY week DESC LIMIT 8`,
        )
        .all(id) as Array<{ week: string; orders: number; revenue: number }>)
        .reverse()
    : [];

  const monthly = hasOrders
    ? (db
        .prepare(
          `SELECT substr(createdAt,1,7) AS month, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
           FROM orders WHERE salespersonId = ? GROUP BY month ORDER BY month DESC LIMIT 6`,
        )
        .all(id) as Array<{ month: string; orders: number; revenue: number }>)
        .reverse()
    : [];

  const recentOrders = hasOrders
    ? (db
        .prepare(
          `SELECT o.id, o.total, o.itemCount, o.status, o.createdAt, c.name AS customerName
           FROM orders o LEFT JOIN customers c ON c.id = o.customerId
           WHERE o.salespersonId = ? ORDER BY o.createdAt DESC LIMIT 15`,
        )
        .all(id) as SalespersonDetail['recentOrders'])
    : [];

  return {
    profile: row, weekly, monthly, recentOrders,
    strategy: salesStrategy(id), journey: getSalespersonJourney(id),
  };
}
