'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Category } from '@/types/database';
import { slugify } from '@/lib/utils';

type TabType = 'basic';

export default function NewCategoryPage() {
  const router = useRouter();
  const locale = useLocale();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json() as { categories?: Category[] };
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id || null,
          sort_order: 0, // Will be set via drag and drop on the list page
        }),
      });

      const data = await response.json() as { error?: string; details?: any; category?: any };

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to create category';
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link
            href="/admin/categories"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Categories
          </Link>
          <h1 className="text-4xl font-semibold text-white mb-2">Create Category</h1>
          <p className="text-neutral-400">Add a new product category</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
          {/* Tabs Navigation */}
          <div className="border-b border-white/10 bg-black/30">
            <div className="flex space-x-1 px-6">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-6 py-4 text-sm font-medium transition-all relative ${
                  activeTab === 'basic'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <span>Basic Info</span>
                {activeTab === 'basic' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 mb-6">
                <div className="text-sm text-red-300 whitespace-pre-line">{error}</div>
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Category Information</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name_en" className="block text-sm font-medium text-neutral-300 mb-2">
                          Category Name (English) *
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
                          Category Name (Swedish) *
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
                        Slug *
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
                      <p className="mt-1 text-xs text-neutral-400">URL-friendly identifier (auto-generated from English name)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="description_en" className="block text-sm font-medium text-neutral-300 mb-2">
                          Description (English)
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
                          Description (Swedish)
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
                      <label htmlFor="parent_id" className="block text-sm font-medium text-neutral-300 mb-2">
                        Parent Category
                      </label>
                      <select
                        id="parent_id"
                        name="parent_id"
                        value={formData.parent_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                      >
                        <option value="">None (Top-level category)</option>
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

                    <div>
                      <label htmlFor="image_url" className="block text-sm font-medium text-neutral-300 mb-2">
                        Image URL
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
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
              <Link
                href="/admin/categories"
                className="px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

