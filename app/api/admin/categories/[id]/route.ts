import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getCategoryById, updateCategory, deleteCategory, getCategoryBySlug, getCategories } from '@/lib/db/queries/products';
import type { Category } from '@/types/database';

const updateCategorySchema = z.object({
  name_en: z.string().min(1).optional(),
  name_sv: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description_en: z.string().nullable().optional(),
  description_sv: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const category = await getCategoryById(db, id);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: 'Failed to get category' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validated = updateCategorySchema.parse(body);

    // Check if category exists
    const existingCategory = await getCategoryById(db, id);
    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if slug is being changed and if new slug already exists
    if (validated.slug && validated.slug !== existingCategory.slug) {
      const slugExists = await getCategoryBySlug(db, validated.slug);
      if (slugExists) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prevent setting parent to itself or creating circular references
    if (validated.parent_id) {
      if (validated.parent_id === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        );
      }
      // Check for circular reference (parent's parent chain)
      let currentParentId = validated.parent_id;
      const visited = new Set<string>([id]);
      while (currentParentId) {
        if (visited.has(currentParentId)) {
          return NextResponse.json(
            { error: 'Circular reference detected in category hierarchy' },
            { status: 400 }
          );
        }
        visited.add(currentParentId);
        const parent = await getCategoryById(db, currentParentId);
        if (!parent) break;
        currentParentId = parent.parent_id || '';
      }
    }

    await updateCategory(db, id, {
      nameEn: validated.name_en,
      nameSv: validated.name_sv,
      slug: validated.slug,
      descriptionEn: validated.description_en,
      descriptionSv: validated.description_sv,
      imageUrl: validated.image_url,
      parentId: validated.parent_id,
      sortOrder: validated.sort_order,
    });

    const updatedCategory = await getCategoryById(db, id);
    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await deleteCategory(db, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete category' },
      { status: 500 }
    );
  }
}

