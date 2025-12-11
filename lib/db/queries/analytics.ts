import { D1Database } from '@cloudflare/workers-types';
import { queryDB } from '../client';

export interface SalesDataPoint {
  date: string; // YYYY-MM-DD format
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

/**
 * Get sales data grouped by date for a time period
 */
export async function getSalesData(
  db: D1Database,
  days: number = 30
): Promise<SalesDataPoint[]> {
  const startDate = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
  
  const result = await queryDB<{
    date: string;
    revenue: number;
    orders: number;
  }>(
    db,
    `SELECT 
      date(created_at, 'unixepoch') as date,
      SUM(total) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE created_at >= ? AND payment_status = 'paid'
    GROUP BY date(created_at, 'unixepoch')
    ORDER BY date ASC`,
    [startDate]
  );

  return (result.results || []).map((row) => ({
    date: row.date,
    revenue: Number(row.revenue) || 0,
    orders: Number(row.orders) || 0,
  }));
}

/**
 * Get top selling products
 */
export async function getTopProducts(
  db: D1Database,
  limit: number = 10
): Promise<TopProduct[]> {
  const result = await queryDB<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
  }>(
    db,
    `SELECT 
      oi.product_id,
      oi.product_name,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.total) as total_revenue,
      COUNT(DISTINCT oi.order_id) as order_count
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY total_quantity DESC
    LIMIT ?`,
    [limit]
  );

  return (result.results || []).map((row) => ({
    product_id: row.product_id,
    product_name: row.product_name,
    total_quantity: Number(row.total_quantity) || 0,
    total_revenue: Number(row.total_revenue) || 0,
    order_count: Number(row.order_count) || 0,
  }));
}

/**
 * Get revenue by status
 */
export async function getRevenueByStatus(db: D1Database): Promise<{
  paid: number;
  pending: number;
  refunded: number;
}> {
  const result = await queryDB<{
    payment_status: string;
    total: number;
  }>(
    db,
    `SELECT 
      payment_status,
      SUM(total) as total
    FROM orders
    GROUP BY payment_status`
  );

  const revenue = {
    paid: 0,
    pending: 0,
    refunded: 0,
  };

  (result.results || []).forEach((row) => {
    const status = row.payment_status.toLowerCase();
    if (status === 'paid') {
      revenue.paid = Number(row.total) || 0;
    } else if (status === 'pending') {
      revenue.pending = Number(row.total) || 0;
    } else if (status === 'refunded') {
      revenue.refunded = Number(row.total) || 0;
    }
  });

  return revenue;
}

