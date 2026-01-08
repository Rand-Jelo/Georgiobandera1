import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { updateCategory } from '@/lib/db/queries/products';

const reorderSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    sort_order: z.number().int(),
  })),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = reorderSchema.parse(body);

    // Update all categories with their new sort_order
    await Promise.all(
      validated.updates.map((update) =>
        updateCategory(db, update.id, {
          sortOrder: update.sort_order,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Reorder categories error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}

