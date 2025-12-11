import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getStoreSettings, upsertStoreSettings } from '@/lib/db/queries/settings';

/**
 * GET /api/admin/settings/store
 * Get store settings (admin only)
 */
export async function GET() {
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

    const settings = await getStoreSettings(db);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get store settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get store settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/store
 * Update store settings (admin only)
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

    const body = await request.json() as {
      store_name: string;
      store_email: string;
      store_phone?: string | null;
      store_address?: string | null;
      store_city?: string | null;
      store_postal_code?: string | null;
      store_country?: string | null;
      currency?: string;
      tax_rate?: number;
    };
    const settings = await upsertStoreSettings(db, body);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update store settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update store settings' },
      { status: 500 }
    );
  }
}

