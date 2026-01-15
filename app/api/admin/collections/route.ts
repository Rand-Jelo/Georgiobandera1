import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  reorderCollections,
} from '@/lib/db/queries/collections';

/**
 * GET /api/admin/collections
 * Get all collections (admin only)
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

    const collections = await getAllCollections(db);
    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Get all collections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/collections
 * Create a new collection (admin only)
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
      name_en: string;
      name_sv: string;
      description_en?: string | null;
      description_sv?: string | null;
      href: string;
      image_url?: string | null;
      sort_order?: number;
      active?: number;
    };

    const collection = await createCollection(db, body);
    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/collections
 * Update collections (admin only) - can handle reordering
 */
export async function PATCH(request: NextRequest) {
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
      action?: 'reorder';
      collectionIds?: string[];
      id?: string;
      name_en?: string;
      name_sv?: string;
      description_en?: string | null;
      description_sv?: string | null;
      href?: string;
      image_url?: string | null;
      sort_order?: number;
      active?: number;
    };

    // Handle reordering
    if (body.action === 'reorder' && body.collectionIds) {
      await reorderCollections(db, body.collectionIds);
      const collections = await getAllCollections(db);
      return NextResponse.json({ collections });
    }

    // Handle single collection update
    if (body.id) {
      const collection = await updateCollection(db, body.id, {
        name_en: body.name_en,
        name_sv: body.name_sv,
        description_en: body.description_en,
        description_sv: body.description_sv,
        href: body.href,
        image_url: body.image_url,
        sort_order: body.sort_order,
        active: body.active,
      });
      return NextResponse.json({ collection });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update collections error:', error);
    return NextResponse.json(
      { error: 'Failed to update collections' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/collections
 * Delete a collection (admin only)
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    await deleteCollection(db, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete collection error:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

