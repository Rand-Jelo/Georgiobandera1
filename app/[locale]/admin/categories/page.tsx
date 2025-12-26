'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Category } from '@/types/database';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const locale = useLocale();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json() as { user?: { is_admin?: boolean } };
      if (!data.user || !data.user.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchCategories();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch nested categories structure
      const response = await fetch('/api/categories');
      const data = await response.json() as { categories?: CategoryWithChildren[]; error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (!response.ok) {
        alert(data.error || 'Failed to delete category');
        return;
      }

      // Refresh categories list
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('An error occurred while deleting the category.');
    }
  };

  const renderCategoryRow = (category: CategoryWithChildren, level: number = 0) => {
    const name = locale === 'sv' ? category.name_sv : category.name_en;
    const isSubcategory = level > 0;

    return (
      <React.Fragment key={category.id}>
        <tr className={`hover:bg-black/30 transition-colors ${isSubcategory ? 'bg-black/20' : ''}`}>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {isSubcategory && (
                <span className="text-neutral-500 text-xs">└─</span>
              )}
              <div className={`text-sm ${isSubcategory ? 'text-neutral-300' : 'font-medium text-white'}`}>
                {name}
              </div>
              {isSubcategory && (
                <span className="text-xs text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded">
                  Subcategory
                </span>
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className={`text-sm ${isSubcategory ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {category.slug}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-neutral-400">
              {category.parent_id ? (
                (() => {
                  const findParentName = (cats: CategoryWithChildren[], parentId: string): string => {
                    for (const cat of cats) {
                      if (cat.id === parentId) {
                        return locale === 'sv' ? cat.name_sv : cat.name_en;
                      }
                      if (cat.children) {
                        const found = findParentName(cat.children, parentId);
                        if (found) return found;
                      }
                    }
                    return '-';
                  };
                  return findParentName(categories, category.parent_id);
                })()
              ) : (
                '-'
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className={`text-sm ${isSubcategory ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {category.sort_order}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="relative inline-block">
              <button
                ref={(el) => {
                  if (el && openMenuId === category.id && !menuPosition) {
                    const rect = el.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 8,
                      right: window.innerWidth - rect.right,
                    });
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (openMenuId === category.id) {
                    setOpenMenuId(null);
                    setMenuPosition(null);
                  } else {
                    setOpenMenuId(category.id);
                    setMenuPosition(null); // Reset to trigger ref callback
                  }
                }}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Category actions"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        {category.children && category.children.length > 0 && (
          <>
            {category.children.map((child) => renderCategoryRow(child, level + 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-semibold text-white mb-2">Categories</h1>
            <p className="text-neutral-400">Organize your product categories</p>
          </div>
          <Link
            href="/admin/categories/new"
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-neutral-100 transition-colors"
          >
            Add Category
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 text-lg mb-4">No categories found.</p>
            <Link
              href="/admin/categories/new"
              className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-neutral-100 transition-colors"
            >
              Create Your First Category
            </Link>
          </div>
        ) : (
          <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/70">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Sort Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {categories.map((category) => renderCategoryRow(category, 0))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dropdown menu - rendered outside table to avoid clipping */}
        {openMenuId && menuPosition && (() => {
          const findCategory = (cats: CategoryWithChildren[], id: string): CategoryWithChildren | null => {
            for (const cat of cats) {
              if (cat.id === id) return cat;
              if (cat.children) {
                const found = findCategory(cat.children, id);
                if (found) return found;
              }
            }
            return null;
          };
          const category = findCategory(categories, openMenuId);
          if (!category) return null;
          const categoryName = locale === 'sv' ? category.name_sv : category.name_en;
          return (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => {
                  setOpenMenuId(null);
                  setMenuPosition(null);
                }}
              />
              {/* Dropdown menu */}
              <div
                className="fixed w-48 rounded-lg border border-white/10 bg-black/95 backdrop-blur-sm shadow-xl z-[101]"
                style={{
                  top: `${menuPosition.top}px`,
                  right: `${menuPosition.right}px`,
                }}
              >
                <div className="py-1">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuPosition(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors block"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      handleDelete(category.id, categoryName);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

