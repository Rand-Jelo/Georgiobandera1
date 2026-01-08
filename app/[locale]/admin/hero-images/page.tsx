'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { HeroImage } from '@/types/database';
import { optimizeImage, formatFileSize } from '@/lib/utils/imageOptimization';

export default function AdminHeroImagesPage() {
  const router = useRouter();
  const locale = useLocale();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    alt_text_en: '',
    alt_text_sv: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

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
      fetchImages();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/hero-images');
      const data = await response.json() as { images?: HeroImage[] };
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching hero images:', error);
    }
  };

  const handleAdd = () => {
    setEditingImage(null);
    setFormData({
      url: '',
      alt_text_en: '',
      alt_text_sv: '',
      active: true,
    });
    setShowAddForm(true);
    setError('');
  };

  const handleEdit = (image: HeroImage) => {
    setEditingImage(image);
    setFormData({
      url: image.url,
      alt_text_en: image.alt_text_en || '',
      alt_text_sv: image.alt_text_sv || '',
      active: image.active === 1,
    });
    setShowAddForm(true);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/hero-images/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        alert(data.error || 'Failed to delete image');
        return;
      }

      await fetchImages();
    } catch (error) {
      console.error('Error deleting hero image:', error);
      alert('Failed to delete image');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      // Optimize image before upload
      const originalSize = file.size;
      console.log(`Original image size: ${formatFileSize(originalSize)}`);
      
      const optimizedBlob = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeKB: 500, // Max 500KB
      });

      const optimizedSize = optimizedBlob.size;
      const compressionRatio = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      console.log(`Optimized image size: ${formatFileSize(optimizedSize)} (${compressionRatio}% reduction)`);

      // Create a File from the optimized Blob
      const optimizedFile = new File([optimizedBlob], file.name, {
        type: file.type || 'image/jpeg',
        lastModified: Date.now(),
      });

      const uploadFormData = new FormData();
      uploadFormData.append('file', optimizedFile);
      uploadFormData.append('alt_text_en', formData.alt_text_en || '');
      uploadFormData.append('alt_text_sv', formData.alt_text_sv || '');
      uploadFormData.append('active', formData.active.toString());

      // If editing, include the image ID to update instead of create
      if (editingImage) {
        uploadFormData.append('image_id', editingImage.id);
      }

      const response = await fetch('/api/admin/hero-images/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json() as { error?: string; image?: HeroImage };

      if (!response.ok) {
        setError(data.error || 'Failed to upload image');
        setUploadingImage(false);
        return;
      }

      setShowAddForm(false);
      setEditingImage(null);
      setFormData({
        url: '',
        alt_text_en: '',
        alt_text_sv: '',
        active: true,
      });
      await fetchImages();
      // Reset file input
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('An error occurred while uploading the image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing, allow updating metadata without changing the image
    if (!editingImage) {
      setError('Please upload an image file first');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/hero-images/${editingImage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Don't update URL if it hasn't changed (file upload handles URL updates)
          alt_text_en: formData.alt_text_en || null,
          alt_text_sv: formData.alt_text_sv || null,
          active: formData.active,
        }),
      });

      const data = await response.json() as { error?: string; image?: HeroImage };

      if (!response.ok) {
        setError(data.error || 'Failed to save image');
        return;
      }

      setShowAddForm(false);
      setEditingImage(null);
      await fetchImages();
    } catch (error) {
      console.error('Error saving hero image:', error);
      setError('Failed to save image');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (dragIndex: number, dropIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, removed);

    // Update sort_order optimistically
    setImages(newImages);

    try {
      const imageIds = newImages.map(img => img.id);
      const response = await fetch('/api/admin/hero-images/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      });

      if (!response.ok) {
        // Revert on error
        await fetchImages();
        alert('Failed to reorder images');
      }
    } catch (error) {
      console.error('Error reordering images:', error);
      await fetchImages();
      alert('Failed to reorder images');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white mb-2">Hero Images</h1>
              <p className="text-neutral-400">Manage homepage hero carousel images</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-white text-black rounded-sm hover:bg-neutral-100 transition-colors text-sm font-medium"
            >
              Add Image
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 p-6 border border-white/10 bg-black/50 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingImage ? 'Edit Image' : 'Add New Image'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File upload - available for both add and edit */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {editingImage ? 'Replace Image (optional)' : 'Upload Image *'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-white file:text-black hover:file:bg-neutral-100 disabled:opacity-50"
                />
                {uploadingImage && (
                  <p className="mt-2 text-sm text-neutral-400">Uploading and optimizing image...</p>
                )}
                {editingImage && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Leave empty to keep current image, or upload a new file to replace it
                  </p>
                )}
              </div>

              {/* URL input - only shown when editing and no file is being uploaded */}
              {editingImage && !uploadingImage && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Current Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    placeholder="/api/images/hero/image.jpg"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    To change the image, upload a new file above
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Alt Text (English)
                  </label>
                  <input
                    type="text"
                    value={formData.alt_text_en}
                    onChange={(e) => setFormData({ ...formData, alt_text_en: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    placeholder="Description for screen readers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Alt Text (Swedish)
                  </label>
                  <input
                    type="text"
                    value={formData.alt_text_sv}
                    onChange={(e) => setFormData({ ...formData, alt_text_sv: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    placeholder="Beskrivning för skärmläsare"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-white">Active (visible on homepage)</span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-sm text-red-200 text-sm">
                  {error}
                </div>
              )}

              {editingImage && (
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-white text-black rounded-sm hover:bg-neutral-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingImage(null);
                      setError('');
                    }}
                    className="px-6 py-2 border border-white/20 text-white rounded-sm hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {!editingImage && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingImage(null);
                      setError('');
                    }}
                    className="px-6 py-2 border border-white/20 text-white rounded-sm hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Images List */}
        {images.length === 0 ? (
          <div className="text-center py-16 border border-white/10 bg-black/50 rounded-lg">
            <svg
              className="w-16 h-16 text-neutral-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No hero images</h3>
            <p className="text-neutral-400 mb-6">
              Get started by adding your first hero image to display on the homepage.
            </p>
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-white text-black rounded-sm hover:bg-neutral-100 transition-colors text-sm font-medium"
            >
              Add First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="border border-white/10 bg-black/50 rounded-lg overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-neutral-900">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${image.url})` }}
                  />
                  {image.active === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Inactive</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-sm text-neutral-400 mb-1">Alt Text (EN)</p>
                    <p className="text-white text-sm">
                      {image.alt_text_en || <span className="text-neutral-500">Not set</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(image)}
                      className="flex-1 px-3 py-2 border border-white/20 text-white rounded-sm hover:bg-white/10 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="px-3 py-2 border border-red-500/50 text-red-400 rounded-sm hover:bg-red-500/10 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reorder Instructions */}
        {images.length > 1 && (
          <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-200">
              <strong>Note:</strong> Images are displayed in the order shown above. Drag and drop functionality will be added in a future update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

