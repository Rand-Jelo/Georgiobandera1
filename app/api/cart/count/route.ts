import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getCartItems } from '@/lib/db/queries/cart';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const db = (request as any).env?.DB;
    
    if (!db) {
      return NextResponse.json({ count: 0 });
    }

    const sessionId = request.cookies.get('session-id')?.value || undefined;
    const items = await getCartItems(db, session?.userId, sessionId);
    
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Get cart count error:', error);
    return NextResponse.json({ count: 0 });
  }
}

