'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Category } from '@/types/database';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export default function AdminCategoriesPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const locale = useLocale();
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedOverId, setDraggedOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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
      // Fetch nested categories structure with no-cache to get fresh data
      const response = await fetch('/api/categories', { cache: 'no-store' });
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

  // Flatten categories for drag and drop (only top-level categories)
  const flattenCategories = (cats: CategoryWithChildren[]): Category[] => {
    return cats.filter(cat => !cat.parent_id);
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

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedId(categoryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryId);
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== categoryId) {
      setDraggedOverId(categoryId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    setDraggedOverId(null);

    if (!draggedId || draggedId === targetCategoryId) {
      setDraggedId(null);
      return;
    }

    // Get flattened list of top-level categories
    const flatCategories = flattenCategories(categories);
    const draggedIndex = flatCategories.findIndex(c => c.id === draggedId);
    const targetIndex = flatCategories.findIndex(c => c.id === targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder categories
    const reordered = [...flatCategories];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update sort_order based on new positions
    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }));

    // Optimistically update UI immediately
    const updatedCategories = categories.map(cat => {
      const update = reordered.find(r => r.id === cat.id);
      if (update) {
        return { ...cat, sort_order: reordered.indexOf(update) };
      }
      return cat;
    });
    // Sort by new sort_order
    updatedCategories.sort((a, b) => {
      const aIndex = reordered.findIndex(r => r.id === a.id);
      const bIndex = reordered.findIndex(r => r.id === b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    setCategories(updatedCategories);

    setIsReordering(true);
    try {
      const response = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        alert(data.error || 'Failed to reorder categories');
        // Revert on error
        await fetchCategories();
      }
      // Don't refetch on success - we already updated optimistically
    } catch (err) {
      console.error('Error reordering categories:', err);
      alert('An error occurred while reordering categories.');
      // Revert on error
      await fetchCategories();
    } finally {
      setIsReordering(false);
      setDraggedId(null);
    }
  };

  const renderCategoryRow = (category: CategoryWithChildren, level: number = 0) => {
    const name = locale === 'sv' ? category.name_sv : category.name_en;
    const isSubcategory = level > 0;
    const isDragging = draggedId === category.id;
    const isDraggedOver = draggedOverId === category.id;
    const isDraggable = !isSubcategory && !isReordering;

    return (
      <React.Fragment key={category.id}>
        <tr
          className={`hover:bg-black/30 transition-colors ${isSubcategory ? 'bg-black/20' : ''} ${
            isDragging ? 'opacity-50' : ''
          } ${isDraggedOver ? 'bg-white/10' : ''} ${isDraggable ? 'cursor-move' : ''}`}
          draggable={isDraggable}
          onDragStart={(e) => isDraggable && handleDragStart(e, category.id)}
          onDragOver={(e) => isDraggable && handleDragOver(e, category.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => isDraggable && handleDrop(e, category.id)}
        >
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {isDraggable && (
                <svg
                  className="w-4 h-4 text-neutral-500 cursor-move hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8h16M4 16h16"
                  />
                </svg>
              )}
              {isSubcategory && (
                <span className="text-neutral-500 text-xs">└─</span>
              )}
              <div className={`text-xs sm:text-sm ${isSubcategory ? 'text-neutral-300' : 'font-medium text-white'}`}>
                {name}
              </div>
              {isSubcategory && (
                <span className="text-xs text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded hidden sm:inline">
                  {t('subcategory')}
                </span>
              )}
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
            <div className={`text-sm ${isSubcategory ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {category.slug}
            </div>
          </td>
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
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
          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
    <div className="min-h-screen bg-neutral-950 py-6 sm:py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
            >
              {t('backToDashboard')}
            </Link>
            <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('categories')}</h1>
            <p className="text-sm sm:text-base text-neutral-400">{t('organizeCategories')}</p>
          </div>
          <Link
            href="/admin/categories/new"
            className="rounded-lg bg-white px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-black hover:bg-neutral-100 transition-colors self-start sm:self-auto"
          >
            {t('addCategory')}
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="bg-black/50 border border-white/10 rounded-lg p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-neutral-400 text-base sm:text-lg font-medium mb-2">{t('noCategoriesFound')}</p>
              <p className="text-neutral-500 text-xs sm:text-sm mb-4">
                {t('createFirstCategoryDesc')}
              </p>
              <Link
                href="/admin/categories/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('createFirstCategory')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/70">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden sm:table-cell">
                      {t('slug')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                      {t('parent')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {categories.map((category) => renderCategoryRow(category, 0))}
                </tbody>
              </table>
            </div>
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
                    {t('edit')}
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
                    {t('delete')}
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

