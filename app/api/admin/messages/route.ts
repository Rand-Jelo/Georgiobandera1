import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getMessages } from '@/lib/db/queries/messages';
import type { Message } from '@/types/database';

/**
 * GET /api/admin/messages
 * Get all messages for admin (with optional status filter and search)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as Message['status'] | null;
    const search = searchParams.get('search') || undefined;

    const messages = await getMessages(db, {
      status: status || undefined,
      search: search,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get admin messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

