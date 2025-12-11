import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getStoreSettings } from '@/lib/db/queries/settings';
import { queryDB, executeDB } from '@/lib/db/client';
import { generateOrderNumber } from '@/lib/utils';
import { calculateTaxFromInclusive, getDefaultTaxRate } from '@/lib/utils/tax';

/**
 * DELETE /api/admin/seed-sales
 * Delete sample sales data (orders with customer*@example.com emails) (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete order items first (CASCADE should handle this, but being explicit)
    await executeDB(
      db,
      `DELETE FROM order_items 
       WHERE order_id IN (
         SELECT id FROM orders WHERE email LIKE 'customer%@example.com'
       )`
    );

    // Delete sample orders (identified by email pattern)
    const result = await executeDB(
      db,
      `DELETE FROM orders WHERE email LIKE 'customer%@example.com'`
    );

    return NextResponse.json({
      success: true,
      message: 'Sample sales data deleted successfully',
      deletedOrders: result.meta?.changes || 0,
    });
  } catch (error) {
    console.error('Delete seed sales error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sample sales data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/seed-sales
 * Generate random sales data for testing analytics (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json() as { count?: number } | undefined;
    const count = body?.count || 20; // Default to 20 orders

    // Get all active products
    const productsResult = await queryDB<{
      id: string;
      name_en: string;
      price: number;
    }>(
      db,
      'SELECT id, name_en, price FROM products WHERE status = ? LIMIT 50',
      ['active']
    );

    const products = productsResult.results || [];

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No active products found. Please create some products first.' },
        { status: 400 }
      );
    }

    // Get shipping regions
    const regionsResult = await queryDB<{ id: string }>(
      db,
      'SELECT id FROM shipping_regions WHERE active = 1 LIMIT 1'
    );
    const shippingRegionId = regionsResult.results?.[0]?.id || null;

    const ordersCreated: string[] = [];
    const now = Math.floor(Date.now() / 1000);
    const daysAgo = 90; // Generate orders from last 90 days

    // Generate random orders
    for (let i = 0; i < count; i++) {
      const orderId = crypto.randomUUID();
      const orderNumber = generateOrderNumber();
      
      // Random date within last 90 days
      const daysBack = Math.floor(Math.random() * daysAgo);
      const orderDate = now - (daysBack * 24 * 60 * 60);
      
      // Random number of items (1-4)
      const itemCount = Math.floor(Math.random() * 4) + 1;
      
      // Select random products
      const selectedProducts: typeof products = [];
      const productIndices = new Set<number>();
      while (productIndices.size < itemCount && productIndices.size < products.length) {
        productIndices.add(Math.floor(Math.random() * products.length));
      }
      
      productIndices.forEach((idx) => {
        selectedProducts.push(products[idx]);
      });

      // Calculate totals
      let subtotal = 0;
      const orderItems: Array<{
        productId: string;
        productName: string;
        price: number;
        quantity: number;
      }> = [];

      selectedProducts.forEach((product) => {
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const itemTotal = product.price * quantity;
        subtotal += itemTotal;
        
        orderItems.push({
          productId: product.id,
          productName: product.name_en,
          price: product.price,
          quantity,
        });
      });

      const shippingCost = shippingRegionId ? 50 : 0; // Random shipping cost
      
      // Get tax rate from settings
      const settings = await getStoreSettings(db);
      const taxRate = settings?.tax_rate ? settings.tax_rate / 100 : getDefaultTaxRate(); // Convert percentage to decimal
      
      // Calculate tax from tax-inclusive prices
      const tax = calculateTaxFromInclusive(subtotal, taxRate);
      
      // Total = subtotal (tax-inclusive) + shipping
      const total = subtotal + shippingCost;

      // Random payment status (mostly paid, some pending)
      const paymentStatuses = ['paid', 'paid', 'paid', 'paid', 'pending'] as const;
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

      // Create order
      await executeDB(
        db,
        `INSERT INTO orders (
          id, order_number, email, payment_status, status,
          subtotal, shipping_cost, tax, total, currency, shipping_region_id,
          shipping_name, shipping_address_line1, shipping_city,
          shipping_postal_code, shipping_country, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          `customer${i + 1}@example.com`,
          paymentStatus,
          paymentStatus === 'paid' ? 'paid' : 'pending',
          subtotal,
          shippingCost,
          tax,
          total,
          'SEK',
          shippingRegionId,
          `Customer ${i + 1}`,
          `Street ${i + 1}`,
          'Stockholm',
          '12345',
          'Sweden',
          orderDate,
          orderDate,
        ]
      );

      // Create order items
      for (const item of orderItems) {
        const itemId = crypto.randomUUID();
        await executeDB(
          db,
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, price, quantity, total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            orderId,
            item.productId,
            item.productName,
            item.price,
            item.quantity,
            item.price * item.quantity,
            orderDate,
          ]
        );
      }

      ordersCreated.push(orderNumber);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${count} random orders`,
      ordersCreated: ordersCreated.length,
    });
  } catch (error) {
    console.error('Seed sales error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sales data' },
      { status: 500 }
    );
  }
}

