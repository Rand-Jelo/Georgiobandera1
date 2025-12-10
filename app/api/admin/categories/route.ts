import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { createCategory, getCategories, getCategoryBySlug } from '@/lib/db/queries/products';

const createCategorySchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_sv: z.string().min(1, 'Swedish name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description_en: z.string().nullable().optional(),
  description_sv: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
});

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

    // Get all categories (not nested for admin list)
    const allCategories = await getCategories(db);
    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}

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
    const validated = createCategorySchema.parse(body);

    // Check if slug already exists
    const existingCategory = await getCategoryBySlug(db, validated.slug);
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    // Validate parent_id if provided
    if (validated.parent_id) {
      const parent = await getCategories(db, validated.parent_id);
      if (parent.length === 0) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    const category = await createCategory(db, {
      nameEn: validated.name_en,
      nameSv: validated.name_sv,
      slug: validated.slug,
      descriptionEn: validated.description_en,
      descriptionSv: validated.description_sv,
      imageUrl: validated.image_url,
      parentId: validated.parent_id,
      sortOrder: validated.sort_order,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 500 }
    );
  }
}

