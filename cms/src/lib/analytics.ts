import { getDb } from './db';
import { boxApiUrl, boxFetch } from './box';

function tableExists(name: string): boolean {
  return Boolean(
    getDb().prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name),
  );
}

function count(table: string): number {
  if (!tableExists(table)) return 0;
  return (getDb().prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
}

export interface DashboardMetrics {
  totals: { products: number; salespeople: number; customers: number; orders: number };
  revenue: number;
  currency: string;
  ordersByDay: Array<{ date: string; orders: number; revenue: number }>;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (boxApiUrl()) return boxFetch<DashboardMetrics>('/api/admin/dashboard');

  const db = getDb();
  const hasOrders = tableExists('orders');

  const revenueRow = hasOrders
    ? (db.prepare('SELECT COALESCE(SUM(total),0) AS r FROM orders').get() as { r: number })
    : { r: 0 };

  // Last 14 days of orders + revenue, grouped by calendar day.
  const ordersByDay = hasOrders
    ? (db
        .prepare(
          `SELECT substr(createdAt,1,10) AS date, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
           FROM orders GROUP BY date ORDER BY date DESC LIMIT 14`,
        )
        .all() as Array<{ date: string; orders: number; revenue: number }>)
        .reverse()
    : [];

  const revenueByCategory = hasOrders && tableExists('order_items')
    ? (db
        .prepare(
          `SELECT COALESCE(p.category, 'Unknown') AS category, COALESCE(SUM(oi.lineTotal),0) AS revenue
           FROM order_items oi LEFT JOIN products p ON p.id = oi.productId
           GROUP BY category ORDER BY revenue DESC LIMIT 8`,
        )
        .all() as Array<{ category: string; revenue: number }>)
    : [];

  const ordersByStatus = hasOrders
    ? (db
        .prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status')
        .all() as Array<{ status: string; count: number }>)
    : [];

  const topProducts = hasOrders && tableExists('order_items')
    ? (db
        .prepare(
          `SELECT COALESCE(name,'Item') AS name, SUM(quantity) AS quantity, SUM(lineTotal) AS revenue
           FROM order_items GROUP BY productId ORDER BY revenue DESC LIMIT 6`,
        )
        .all() as Array<{ name: string; quantity: number; revenue: number }>)
    : [];

  return {
    totals: {
      products: count('products'),
      salespeople: count('salespeople'),
      customers: count('customers'),
      orders: count('orders'),
    },
    revenue: revenueRow.r,
    currency: 'INR',
    ordersByDay,
    revenueByCategory,
    ordersByStatus,
    topProducts,
  };
}
