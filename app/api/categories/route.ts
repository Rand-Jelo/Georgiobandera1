import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getCategories } from '@/lib/db/queries/products';
import type { Category } from '@/types/database';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export async function GET(request: NextRequest) {
  try {
    const db = getDB();

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
  } catch (error: any) {
    console.error('Get categories error:', error);
    const errorMessage = error?.message || 'Unknown error';
    // Return empty array instead of error to prevent breaking the site
    // This allows the site to load even if database is not available
    return NextResponse.json({ categories: [] });
  }
}
