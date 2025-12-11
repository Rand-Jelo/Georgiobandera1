import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getGeneralSettings, upsertGeneralSettings } from '@/lib/db/queries/settings';

/**
 * GET /api/admin/settings/general
 * Get general settings (admin only)
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

    const settings = await getGeneralSettings(db);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get general settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get general settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/general
 * Update general settings (admin only)
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
      maintenance_mode?: boolean;
      allow_registrations?: boolean;
      default_language?: string;
    };
    const settings = await upsertGeneralSettings(db, body);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update general settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update general settings' },
      { status: 500 }
    );
  }
}

