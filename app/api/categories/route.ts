import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/db/queries/products';
import type { Category } from '@/types/database';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export async function GET(request: NextRequest) {
  try {
    const db = (request as any).env?.DB;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Get all categories
    const allCategories = await getCategories(db);
    
    // Get top-level categories (no parent)
    const topLevelCategories = allCategories.filter(cat => !cat.parent_id);
    
    // Build nested structure
    const buildCategoryTree = (parentId: string | null): CategoryWithChildren[] => {
      return allCategories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildCategoryTree(cat.id),
        }));
    };
    
    const categoriesWithChildren = topLevelCategories.map(cat => ({
      ...cat,
      children: buildCategoryTree(cat.id),
    }));

    return NextResponse.json({ categories: categoriesWithChildren });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}

