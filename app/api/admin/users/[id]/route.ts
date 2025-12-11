import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById, updateUser } from '@/lib/db/queries/users';
import { queryOne, executeDB } from '@/lib/db/client';

/**
 * PATCH /api/admin/users/[id]
 * Update user (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const currentUser = await getUserById(db, session.userId);

    if (!currentUser || !currentUser.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json() as { is_admin?: boolean };

    // Prevent users from removing their own admin status
    if (id === session.userId && body.is_admin === false) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin status' },
        { status: 400 }
      );
    }

    // Check if this is the last admin and trying to remove admin status
    if (body.is_admin === false) {
      const adminCount = await queryOne<{ count: number }>(
        db,
        'SELECT COUNT(*) as count FROM users WHERE is_admin = 1',
        []
      );
      
      if (adminCount && adminCount.count <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove admin status from the last admin user' },
          { status: 400 }
        );
      }
    }

    await updateUser(db, id, {
      isAdmin: body.is_admin,
    });

    const updatedUser = await getUserById(db, id);
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const currentUser = await getUserById(db, session.userId);

    if (!currentUser || !currentUser.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent users from deleting themselves
    if (id === session.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if this is the last admin
    const userToDelete = await getUserById(db, id);
    if (userToDelete?.is_admin) {
      const adminCount = await queryOne<{ count: number }>(
        db,
        'SELECT COUNT(*) as count FROM users WHERE is_admin = 1',
        []
      );
      
      if (adminCount && adminCount.count <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    await executeDB(db, 'DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

