'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';

interface HomepageContent {
  id: string;
  section: string;
  title_en: string | null;
  title_sv: string | null;
  subtitle_en: string | null;
  subtitle_sv: string | null;
  description_en: string | null;
  description_sv: string | null;
  created_at: number;
  updated_at: number;
}

interface Collection {
  id: string;
  name_en: string;
  name_sv: string;
  description_en: string | null;
  description_sv: string | null;
  href: string;
  image_url: string | null;
  sort_order: number;
  active: number;
  created_at: number;
  updated_at: number;
}

export default function AdminHomepageContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<HomepageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title_en: '',
    title_sv: '',
    subtitle_en: '',
    subtitle_sv: '',
    description_en: '',
    description_sv: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [collectionFormData, setCollectionFormData] = useState({
    name_en: '',
    name_sv: '',
    description_en: '',
    description_sv: '',
    href: '',
    active: 1,
  });
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

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
      fetchContent();
      fetchCollections();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/homepage-content', { cache: 'no-store' });
      const data = await response.json() as { content?: HomepageContent[] };
      setContent(data.content || []);
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/admin/collections', { cache: 'no-store' });
      const data = await response.json() as { collections?: Collection[] };
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const getContentForSection = (section: string): HomepageContent | undefined => {
    return content.find(c => c.section === section);
  };

  const handleEdit = (section: string) => {
    const item = getContentForSection(section);
    setEditingSection(section);
    setFormData({
      title_en: item?.title_en || '',
      title_sv: item?.title_sv || '',
      subtitle_en: item?.subtitle_en || '',
      subtitle_sv: item?.subtitle_sv || '',
      description_en: item?.description_en || '',
      description_sv: item?.description_sv || '',
    });
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/admin/homepage-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: editingSection,
          title_en: formData.title_en || null,
          title_sv: formData.title_sv || null,
          subtitle_en: formData.subtitle_en || null,
          subtitle_sv: formData.subtitle_sv || null,
          description_en: formData.description_en || null,
          description_sv: formData.description_sv || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to save content');
      }

      await fetchContent();
      setEditingSection(null);
      alert('Content saved successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to save content');
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData({
      title_en: '',
      title_sv: '',
      subtitle_en: '',
      subtitle_sv: '',
      description_en: '',
      description_sv: '',
    });
    setError('');
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection.id);
    setCollectionFormData({
      name_en: collection.name_en,
      name_sv: collection.name_sv,
      description_en: collection.description_en || '',
      description_sv: collection.description_sv || '',
      href: collection.href,
      active: collection.active,
    });
    setError('');
  };

  const handleSaveCollection = async () => {
    if (!editingCollection) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/admin/collections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCollection,
          name_en: collectionFormData.name_en,
          name_sv: collectionFormData.name_sv,
          description_en: collectionFormData.description_en || null,
          description_sv: collectionFormData.description_sv || null,
          href: collectionFormData.href,
          active: collectionFormData.active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to save collection');
      }

      await fetchCollections();
      setEditingCollection(null);
      alert('Collection saved successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to save collection');
      console.error('Error saving collection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCollection = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_en: collectionFormData.name_en,
          name_sv: collectionFormData.name_sv,
          description_en: collectionFormData.description_en || null,
          description_sv: collectionFormData.description_sv || null,
          href: collectionFormData.href,
          active: collectionFormData.active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to create collection');
      }

      await fetchCollections();
      setShowNewCollectionForm(false);
      setCollectionFormData({
        name_en: '',
        name_sv: '',
        description_en: '',
        description_sv: '',
        href: '',
        active: 1,
      });
      alert('Collection created successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to create collection');
      console.error('Error creating collection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/collections?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        alert(errorData.error || 'Failed to delete collection');
        return;
      }

      await fetchCollections();
      alert('Collection deleted successfully!');
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, collectionId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(collectionId);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collection_id', collectionId);

      const response = await fetch('/api/admin/collections/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to upload image');
      }

      await fetchCollections();
      alert('Image uploaded successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(null);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const collectionsContent = getContentForSection('collections');

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-semibold text-white mb-2">Homepage Content</h1>
          <p className="text-neutral-400">Manage text content displayed on the homepage</p>
        </div>

        {/* Collections Section */}
        <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Collections Section</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  "Discover Our Range" section on homepage
                </p>
              </div>
              {!editingSection && (
                <button
                  onClick={() => handleEdit('collections')}
                  className="px-4 py-2 bg-white text-black text-sm font-medium hover:bg-neutral-100 transition-colors rounded-lg"
                >
                  Edit
                </button>
              )}
            </div>

            {editingSection === 'collections' ? (
              <form onSubmit={handleSave} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* English */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
                      English
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={formData.subtitle_en}
                        onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Explore Collections"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title_en}
                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Discover Our Range"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Optional description text"
                      />
                    </div>
                  </div>

                  {/* Swedish */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
                      Swedish
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={formData.subtitle_sv}
                        onChange={(e) => setFormData({ ...formData, subtitle_sv: e.target.value })}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Utforska Kollektioner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title_sv}
                        onChange={(e) => setFormData({ ...formData, title_sv: e.target.value })}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Upptäck Vårt Sortiment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={formData.description_sv}
                        onChange={(e) => setFormData({ ...formData, description_sv: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Valfri beskrivningstext"
                      />
                    </div>
                  </div>
                </div>

                {/* Collection Cards Management */}
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Collection Cards</h3>
                  <p className="text-sm text-neutral-400 mb-6">
                    Manage the individual collection cards displayed in this section
                  </p>

                  {!showNewCollectionForm && !editingCollection && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCollectionForm(true);
                        setCollectionFormData({
                          name_en: '',
                          name_sv: '',
                          description_en: '',
                          description_sv: '',
                          href: '',
                          active: 1,
                        });
                        setError('');
                      }}
                      className="mb-6 px-4 py-2 bg-white text-black text-sm font-medium hover:bg-neutral-100 transition-colors rounded-lg"
                    >
                      Add Collection
                    </button>
                  )}

                  {showNewCollectionForm && (
                    <div className="bg-black/30 border border-white/5 rounded-lg overflow-hidden mb-6 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-base font-semibold text-white">New Collection</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCollectionForm(false);
                            setCollectionFormData({
                              name_en: '',
                              name_sv: '',
                              description_en: '',
                              description_sv: '',
                              href: '',
                              active: 1,
                            });
                            setError('');
                          }}
                          className="text-neutral-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-6">
                        {error && (
                          <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                            {error}
                          </div>
                        )}
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">English</h4>
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Name *</label>
                              <input
                                type="text"
                                required
                                value={collectionFormData.name_en}
                                onChange={(e) => setCollectionFormData({ ...collectionFormData, name_en: e.target.value })}
                                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                              <input
                                type="text"
                                value={collectionFormData.description_en}
                                onChange={(e) => setCollectionFormData({ ...collectionFormData, description_en: e.target.value })}
                                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Swedish</h4>
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Name *</label>
                              <input
                                type="text"
                                required
                                value={collectionFormData.name_sv}
                                onChange={(e) => setCollectionFormData({ ...collectionFormData, name_sv: e.target.value })}
                                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                              <input
                                type="text"
                                value={collectionFormData.description_sv}
                                onChange={(e) => setCollectionFormData({ ...collectionFormData, description_sv: e.target.value })}
                                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                          <button
                            type="button"
                            onClick={handleCreateCollection}
                            disabled={saving || !collectionFormData.name_en || !collectionFormData.name_sv}
                            className="px-6 py-2.5 bg-white text-black text-sm font-medium hover:bg-neutral-100 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Creating...' : 'Create Collection'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCollectionForm(false);
                              setCollectionFormData({
                                name_en: '',
                                name_sv: '',
                                description_en: '',
                                description_sv: '',
                                href: '',
                                active: 1,
                              });
                              setError('');
                            }}
                            disabled={saving}
                            className="px-6 py-2.5 border border-white/20 text-neutral-300 text-sm font-medium hover:bg-white/10 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {collections.map((collection) => (
                      <div key={collection.id} className="bg-black/30 border border-white/5 rounded-lg overflow-hidden">
                        <div className="p-6">
                          {editingCollection === collection.id ? (
                            <div className="space-y-6">
                              {error && (
                                <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                  {error}
                                </div>
                              )}
                              <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-4">
                                  <h4 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">English</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Name *</label>
                                    <input
                                      type="text"
                                      required
                                      value={collectionFormData.name_en}
                                      onChange={(e) => setCollectionFormData({ ...collectionFormData, name_en: e.target.value })}
                                      className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                                    <input
                                      type="text"
                                      value={collectionFormData.description_en}
                                      onChange={(e) => setCollectionFormData({ ...collectionFormData, description_en: e.target.value })}
                                      className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h4 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Swedish</h4>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Name *</label>
                                    <input
                                      type="text"
                                      required
                                      value={collectionFormData.name_sv}
                                      onChange={(e) => setCollectionFormData({ ...collectionFormData, name_sv: e.target.value })}
                                      className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                                    <input
                                      type="text"
                                      value={collectionFormData.description_sv}
                                      onChange={(e) => setCollectionFormData({ ...collectionFormData, description_sv: e.target.value })}
                                      className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Image</label>
                                {collection.image_url && (
                                  <div className="mb-3">
                                    <p className="text-xs text-neutral-500 mb-2">Current Image:</p>
                                    <div className="relative w-32 h-32 bg-neutral-900 rounded-lg overflow-hidden">
                                      <img
                                        src={collection.image_url}
                                        alt={collection.name_en}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, collection.id)}
                                  disabled={uploadingImage === collection.id}
                                  className="w-full px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white file:text-black hover:file:bg-neutral-100 disabled:opacity-50"
                                />
                                {uploadingImage === collection.id && (
                                  <p className="mt-2 text-xs text-neutral-400">Uploading image...</p>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={collectionFormData.active === 1}
                                    onChange={(e) => setCollectionFormData({ ...collectionFormData, active: e.target.checked ? 1 : 0 })}
                                    className="w-4 h-4 border border-white/20 bg-black/50 text-white rounded focus:ring-2 focus:ring-white/30"
                                  />
                                  <span className="text-sm text-neutral-300">Active</span>
                                </label>
                              </div>
                              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={handleSaveCollection}
                                  disabled={saving}
                                  className="px-6 py-2.5 bg-white text-black text-sm font-medium hover:bg-neutral-100 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCollection(null);
                                    setError('');
                                  }}
                                  disabled={saving}
                                  className="px-6 py-2.5 border border-white/20 text-neutral-300 text-sm font-medium hover:bg-white/10 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-base font-semibold text-white">{collection.name_en}</h4>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        collection.active === 1
                                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                      }`}
                                    >
                                      {collection.active === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-neutral-400 mb-2">{collection.description_en || 'No description'}</p>
                                  <p className="text-xs text-neutral-500">Link: <span className="text-neutral-300">/shop?collection={collection.id}</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditCollection(collection)}
                                    className="px-3 py-1.5 bg-white text-black text-xs font-medium hover:bg-neutral-100 transition-colors rounded-lg"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCollection(collection.id)}
                                    className="px-3 py-1.5 border border-red-500/50 text-red-300 text-xs font-medium hover:bg-red-500/10 transition-colors rounded-lg"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="text-neutral-500 mb-1">Swedish Name</p>
                                  <p className="text-neutral-300">{collection.name_sv}</p>
                                </div>
                                <div>
                                  <p className="text-neutral-500 mb-1">Swedish Description</p>
                                  <p className="text-neutral-300">{collection.description_sv || 'No description'}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-white text-black text-sm font-medium hover:bg-neutral-100 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-2.5 border border-white/20 text-neutral-300 text-sm font-medium hover:bg-white/10 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-3">
                      English
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Subtitle</p>
                        <p className="text-sm text-neutral-300">{collectionsContent?.subtitle_en || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Title</p>
                        <p className="text-sm text-white font-medium">{collectionsContent?.title_en || 'Not set'}</p>
                      </div>
                      {collectionsContent?.description_en && (
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Description</p>
                          <p className="text-sm text-neutral-300">{collectionsContent.description_en}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-3">
                      Swedish
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Subtitle</p>
                        <p className="text-sm text-neutral-300">{collectionsContent?.subtitle_sv || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Title</p>
                        <p className="text-sm text-white font-medium">{collectionsContent?.title_sv || 'Not set'}</p>
                      </div>
                      {collectionsContent?.description_sv && (
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Description</p>
                          <p className="text-sm text-neutral-300">{collectionsContent.description_sv}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
