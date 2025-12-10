import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/queries/users';
import { isDatabaseMigrated, runMigrations } from '@/lib/db/migrations';

/**
 * GET /api/admin/migrations
 * Check migration status
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isMigrated = await isDatabaseMigrated(db);
    return NextResponse.json({
      migrated: isMigrated,
      message: isMigrated
        ? 'Database appears to be migrated'
        : 'Database needs migration',
    });
  } catch (error) {
    console.error('Check migration status error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/migrations
 * Run migrations
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await runMigrations(db);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Run migrations error:', error);
    return NextResponse.json(
      { error: 'Failed to run migrations' },
      { status: 500 }
    );
  }
}

