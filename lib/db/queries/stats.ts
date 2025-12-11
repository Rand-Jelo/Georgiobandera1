import { D1Database } from '@cloudflare/workers-types';
import { queryOne } from '../client';

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalCategories: number;
  totalUsers: number;
  lowStockProducts: number;
}

export async function getDashboardStats(db: D1Database): Promise<DashboardStats> {
  // Get total products count
  const totalProductsResult = await queryOne<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM products',
    []
  );
  const totalProducts = totalProductsResult?.count || 0;

  // Get active products count
  const activeProductsResult = await queryOne<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM products WHERE status = 'active'",
    []
  );
  const activeProducts = activeProductsResult?.count || 0;

  // Get total orders count
  const totalOrdersResult = await queryOne<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM orders',
    []
  );
  const totalOrders = totalOrdersResult?.count || 0;

  // Get total revenue (sum of all completed/paid orders)
  const revenueResult = await queryOne<{ total: number }>(
    db,
    "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status IN ('paid', 'completed', 'shipped', 'delivered')",
    []
  );
  const totalRevenue = revenueResult?.total || 0;

  // Get pending orders count
  const pendingOrdersResult = await queryOne<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')",
    []
  );
  const pendingOrders = pendingOrdersResult?.count || 0;

  // Get total categories count
  const totalCategoriesResult = await queryOne<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM categories',
    []
  );
  const totalCategories = totalCategoriesResult?.count || 0;

  // Get total users count
  const totalUsersResult = await queryOne<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM users',
    []
  );
  const totalUsers = totalUsersResult?.count || 0;

  // Get low stock products count (products with stock_quantity < 10 and track_inventory = 1)
  const lowStockResult = await queryOne<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM products WHERE track_inventory = 1 AND stock_quantity < 10 AND status = "active"',
    []
  );
  const lowStockProducts = lowStockResult?.count || 0;

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    totalCategories,
    totalUsers,
    lowStockProducts,
  };
}

