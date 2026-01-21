'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Category } from '@/types/database';
import { slugify } from '@/lib/utils';

type TabType = 'basic' | 'subcategories';

export default function EditCategoryPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const categoryId = params.id as string;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState({
    name_en: '',
    name_sv: '',
    slug: '',
    description_en: '',
    description_sv: '',
    image_url: '',
    parent_id: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildData, setNewChildData] = useState({
    name_en: '',
    name_sv: '',
    slug: '',
  });
  const [addingChild, setAddingChild] = useState(false);
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null);
  const [draggedOverChildId, setDraggedOverChildId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [categoryId]);

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
      await Promise.all([fetchCategories(), fetchCategory(), fetchChildCategories()]);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json() as { categories?: Category[] };
      // Filter out the current category from parent options to prevent self-reference
      setCategories((data.categories || []).filter(c => c.id !== categoryId));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`);
      if (!response.ok) {
        setError('Category not found');
        return;
      }

      const data = await response.json() as { category?: Category };
      if (data.category) {
        setFormData({
          name_en: data.category.name_en,
          name_sv: data.category.name_sv,
          slug: data.category.slug,
          description_en: data.category.description_en || '',
          description_sv: data.category.description_sv || '',
          image_url: data.category.image_url || '',
          parent_id: data.category.parent_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('Failed to load category');
    }
  };

  const fetchChildCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories', { cache: 'no-store' });
      const data = await response.json() as { categories?: Category[] };
      // Get categories that have this category as parent, sorted by sort_order
      const children = (data.categories || [])
        .filter(c => c.parent_id === categoryId)
        .sort((a, b) => a.sort_order - b.sort_order);
      setChildCategories(children);
    } catch (error) {
      console.error('Error fetching child categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from English name if slug is empty
      if (name === 'name_en' && !prev.slug) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id || null,
          // sort_order is managed via drag and drop on the list page
        }),
      });

      const data = await response.json() as { error?: string; details?: any; category?: any };

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to update category';
        if (data.details && Array.isArray(data.details)) {
          errorMessage += '\n\nValidation errors:\n' + data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n');
        }
        setError(errorMessage);
        setSaving(false);
        return;
      }

      router.push('/admin/categories');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSaving(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChildData.name_en || !newChildData.name_sv || !newChildData.slug) {
      alert('Please fill in all required fields (Name EN, Name SV, and Slug)');
      return;
    }

    setAddingChild(true);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_en: newChildData.name_en,
          name_sv: newChildData.name_sv,
          slug: newChildData.slug,
          parent_id: categoryId,
          sort_order: 0, // Will be set via drag and drop on the list page
        }),
      });

      const data = await response.json() as { error?: string; details?: any; category?: any };

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to create subcategory';
        if (data.details && Array.isArray(data.details)) {
          errorMessage += '\n\nValidation errors:\n' + data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n');
        }
        alert(errorMessage);
        setAddingChild(false);
        return;
      }

      // Reset form and refresh child categories
      setNewChildData({
        name_en: '',
        name_sv: '',
        slug: '',
      });
      setShowAddChild(false);
      await fetchChildCategories();
      setAddingChild(false);
    } catch (err) {
      console.error('Error creating subcategory:', err);
      alert('An error occurred. Please try again.');
      setAddingChild(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to delete "${childName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${childId}`, {
        method: 'DELETE',
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (!response.ok) {
        alert(data.error || 'Failed to delete subcategory');
        return;
      }

      await fetchChildCategories();
    } catch (err) {
      console.error('Error deleting child category:', err);
      alert('An error occurred while deleting the subcategory.');
    }
  };

  // Drag and drop handlers for subcategories
  const handleChildDragStart = (e: React.DragEvent, childId: string) => {
    setDraggedChildId(childId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', childId);
  };

  const handleChildDragOver = (e: React.DragEvent, childId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedChildId && draggedChildId !== childId) {
      setDraggedOverChildId(childId);
    }
  };

  const handleChildDragLeave = () => {
    setDraggedOverChildId(null);
  };

  const handleChildDrop = async (e: React.DragEvent, targetChildId: string) => {
    e.preventDefault();
    setDraggedOverChildId(null);

    if (!draggedChildId || draggedChildId === targetChildId) {
      setDraggedChildId(null);
      return;
    }

    const draggedIndex = childCategories.findIndex(c => c.id === draggedChildId);
    const targetIndex = childCategories.findIndex(c => c.id === targetChildId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedChildId(null);
      return;
    }

    // Reorder categories
    const reordered = [...childCategories];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update sort_order based on new positions
    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }));

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
        alert(data.error || 'Failed to reorder subcategories');
        await fetchChildCategories();
      } else {
        // Update local state immediately for better UX
        setChildCategories(reordered);
      }
    } catch (err) {
      console.error('Error reordering subcategories:', err);
      alert('An error occurred while reordering subcategories.');
      await fetchChildCategories();
    } finally {
      setIsReordering(false);
      setDraggedChildId(null);
    }
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin/categories"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToCategories')}
          </Link>
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('editCategory')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('updateCategoryInfo')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
          {/* Tabs Navigation */}
          <div className="border-b border-white/10 bg-black/30">
            <div className="flex space-x-1 px-4 sm:px-6">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all relative ${
                  activeTab === 'basic'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <span>{t('basicInfo')}</span>
                {activeTab === 'basic' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subcategories')}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all relative ${
                  activeTab === 'subcategories'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <span>{t('subcategories')}</span>
                {activeTab === 'subcategories' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-8">
            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 mb-6">
                <div className="text-sm text-red-300 whitespace-pre-line">{error}</div>
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('categoryInfo')}</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="name_en" className="block text-sm font-medium text-neutral-300 mb-2">
                {t('categoryNameEn')} *
              </label>
              <input
                type="text"
                id="name_en"
                name="name_en"
                required
                value={formData.name_en}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="name_sv" className="block text-sm font-medium text-neutral-300 mb-2">
                {t('categoryNameSv')} *
              </label>
              <input
                type="text"
                id="name_sv"
                name="name_sv"
                required
                value={formData.name_sv}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-neutral-300 mb-2">
              {t('slug')} *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
            />
            <p className="mt-1 text-xs text-neutral-400">{t('slugDescriptionShort')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="description_en" className="block text-sm font-medium text-neutral-300 mb-2">
                {t('descriptionEn')}
              </label>
              <textarea
                id="description_en"
                name="description_en"
                rows={4}
                value={formData.description_en}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="description_sv" className="block text-sm font-medium text-neutral-300 mb-2">
                {t('descriptionSv')}
              </label>
              <textarea
                id="description_sv"
                name="description_sv"
                rows={4}
                value={formData.description_sv}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>
          </div>

                    <div>
                      <label htmlFor="image_url" className="block text-sm font-medium text-neutral-300 mb-2">
                        {t('imageUrl')}
                      </label>
                      <input
                        type="url"
                        id="image_url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="parent_id" className="block text-sm font-medium text-neutral-300 mb-2">
                        {t('parentCategory')}
                      </label>
                      <select
                        id="parent_id"
                        name="parent_id"
                        value={formData.parent_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                      >
                        <option value="">{t('noneTopLevel')}</option>
                        {categories.map((category) => {
                          const name = locale === 'sv' ? category.name_sv : category.name_en;
                          return (
                            <option key={category.id} value={category.id}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subcategories Tab */}
            {activeTab === 'subcategories' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{t('subcategories')}</h3>
                    <p className="text-sm text-neutral-400">{t('manageSubcategories')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddChild(!showAddChild)}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 transition-colors self-start sm:self-auto"
                  >
                    {showAddChild ? t('cancel') : t('addSubcategory')}
                  </button>
                </div>

                {showAddChild && (
                  <div className="mb-6 p-4 rounded-lg border border-white/10 bg-black/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          {t('nameEn')} *
                        </label>
                        <input
                          type="text"
                          value={newChildData.name_en}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewChildData((prev) => ({
                              ...prev,
                              name_en: value,
                              slug: prev.slug || slugify(value),
                            }));
                          }}
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          {t('nameSv')} *
                        </label>
                        <input
                          type="text"
                          value={newChildData.name_sv}
                          onChange={(e) => setNewChildData((prev) => ({ ...prev, name_sv: e.target.value }))}
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          {t('slug')} *
                        </label>
                        <input
                          type="text"
                          value={newChildData.slug}
                          onChange={(e) => setNewChildData((prev) => ({ ...prev, slug: e.target.value }))}
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddChild}
                        disabled={addingChild}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {addingChild ? t('creating') : t('createSubcategory')}
                      </button>
                    </div>
                  </div>
                )}

                {childCategories.length === 0 ? (
                  <p className="text-neutral-400 text-sm">{t('noSubcategoriesYet')}</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 mb-2">{t('dragToReorderSubcategories')}</p>
                    {childCategories.map((child) => {
                      const name = locale === 'sv' ? child.name_sv : child.name_en;
                      const isDragging = draggedChildId === child.id;
                      const isDraggedOver = draggedOverChildId === child.id;
                      return (
                        <div
                          key={child.id}
                          draggable={!isReordering}
                          onDragStart={(e) => handleChildDragStart(e, child.id)}
                          onDragOver={(e) => handleChildDragOver(e, child.id)}
                          onDragLeave={handleChildDragLeave}
                          onDrop={(e) => handleChildDrop(e, child.id)}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-white/10 bg-black/30 cursor-move transition-all gap-3 ${
                            isDragging ? 'opacity-50' : ''
                          } ${isDraggedOver ? 'bg-white/10 border-white/30' : ''}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <svg
                              className="w-4 h-4 text-neutral-500 hidden sm:block"
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
                            <div>
                              <div className="text-sm font-medium text-white">{name}</div>
                              <div className="text-xs text-neutral-400 mt-1">{child.slug}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/categories/${child.id}/edit`}
                              className="px-3 py-1 text-xs font-medium text-white hover:text-neutral-300 transition-colors"
                            >
                              {t('edit')}
                            </Link>
                            <button
                              onClick={() => handleDeleteChild(child.id, name)}
                              className="px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-6 border-t border-white/10">
              <Link
                href="/admin/categories"
                className="px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors text-center"
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

