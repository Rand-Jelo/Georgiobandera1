import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getCartItems } from '@/lib/db/queries/cart';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const db = getDB();

    const sessionId = request.cookies.get('session-id')?.value || undefined;
    const items = await getCartItems(db, session?.userId, sessionId);
    
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Add caching headers to reduce requests
    // Cache for 10 seconds - balances freshness with request reduction
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    
    return NextResponse.json({ count }, { headers });
  } catch (error) {
    console.error('Get cart count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
