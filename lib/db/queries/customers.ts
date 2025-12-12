import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne } from '../client';
import type { User, Order } from '@/types/database';

export interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  is_registered: boolean;
  order_count: number;
  total_spent: number;
  last_order_date: number | null;
  created_at: number;
}

export interface CustomerDetail extends Customer {
  orders: Array<{
    id: string;
    order_number: string;
    status: Order['status'];
    total: number;
    created_at: number;
  }>;
}

/**
 * Get all customers (registered users + guest customers from orders)
 */
export async function getAllCustomers(
  db: D1Database,
  options: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Customer[]> {
  // Get registered users with their order stats
  let usersSql = `
    SELECT 
      u.id,
      u.email,
      u.name,
      u.phone,
      1 as is_registered,
      u.created_at,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(CASE WHEN o.status IN ('paid', 'delivered') THEN o.subtotal + o.shipping_cost ELSE 0 END), 0) as total_spent,
      MAX(o.created_at) as last_order_date
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.is_admin = 0
  `;
  const usersParams: any[] = [];

  if (options.search) {
    usersSql += ' AND (u.email LIKE ? OR u.name LIKE ?)';
    const searchTerm = `%${options.search}%`;
    usersParams.push(searchTerm, searchTerm);
  }

  usersSql += ' GROUP BY u.id, u.email, u.name, u.phone, u.created_at';

  // Get guest customers (from orders without user_id)
  let guestsSql = `
    SELECT 
      email as id,
      email,
      MAX(shipping_name) as name,
      MAX(shipping_phone) as phone,
      0 as is_registered,
      MIN(created_at) as created_at,
      COUNT(DISTINCT id) as order_count,
      COALESCE(SUM(CASE WHEN status IN ('paid', 'delivered') THEN subtotal + shipping_cost ELSE 0 END), 0) as total_spent,
      MAX(created_at) as last_order_date
    FROM orders
    WHERE user_id IS NULL
  `;
  const guestsParams: any[] = [];

  if (options.search) {
    guestsSql += ' AND (email LIKE ? OR shipping_name LIKE ?)';
    const searchTerm = `%${options.search}%`;
    guestsParams.push(searchTerm, searchTerm);
  }

  guestsSql += ' GROUP BY email';

  // Combine results
  const usersResult = await queryDB<Customer>(db, usersSql, usersParams);
  const guestsResult = await queryDB<Customer>(db, guestsSql, guestsParams);

  const allCustomers = [
    ...(usersResult.results || []),
    ...(guestsResult.results || []),
  ];

  // Sort by last order date (most recent first), then by total spent
  allCustomers.sort((a, b) => {
    const aDate = a.last_order_date || 0;
    const bDate = b.last_order_date || 0;
    if (bDate !== aDate) {
      return bDate - aDate;
    }
    return b.total_spent - a.total_spent;
  });

  // Apply limit and offset
  if (options.offset || options.limit) {
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : undefined;
    return allCustomers.slice(start, end);
  }

  return allCustomers;
}

/**
 * Get customer details by ID (user ID) or email
 */
export async function getCustomerById(
  db: D1Database,
  idOrEmail: string
): Promise<CustomerDetail | null> {
  // Try to get as registered user first
  const user = await queryOne<User>(
    db,
    'SELECT * FROM users WHERE id = ? OR email = ?',
    [idOrEmail, idOrEmail]
  );

  if (user && !user.is_admin) {
    // Get user's orders
    const ordersResult = await queryDB<{
      id: string;
      order_number: string;
      status: Order['status'];
      total: number;
      created_at: number;
    }>(
      db,
      `SELECT id, order_number, status, subtotal + shipping_cost as total, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.id]
    );

    const orders = ordersResult.results || [];
    const totalSpent = orders
      .filter(o => o.status === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      is_registered: true,
      order_count: orders.length,
      total_spent: totalSpent,
      last_order_date: orders.length > 0 ? orders[0].created_at : null,
      created_at: user.created_at,
      orders: orders,
    };
  }

  // If not a registered user, check guest orders by email
  const guestOrdersResult = await queryDB<{
    id: string;
    order_number: string;
    status: Order['status'];
    total: number;
    created_at: number;
    shipping_name: string;
    shipping_phone: string | null;
  }>(
    db,
    `SELECT id, order_number, status, subtotal + shipping_cost as total, created_at, shipping_name, shipping_phone
     FROM orders
     WHERE user_id IS NULL AND email = ?
     ORDER BY created_at DESC`,
    [idOrEmail]
  );

  const guestOrders = guestOrdersResult.results || [];

  if (guestOrders.length === 0) {
    return null;
  }

  const totalSpent = guestOrders
    .filter(o => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  // Use the most recent order's shipping info
  const latestOrder = guestOrders[0];

  return {
    id: idOrEmail, // Use email as ID for guests
    email: idOrEmail,
    name: latestOrder.shipping_name,
    phone: latestOrder.shipping_phone,
    is_registered: false,
    order_count: guestOrders.length,
    total_spent: totalSpent,
    last_order_date: latestOrder.created_at,
    created_at: latestOrder.created_at,
    orders: guestOrders.map(o => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
    })),
  };
}

