'use client';

import * as React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { HeroImage } from '@/types/database';
import { optimizeImage, formatFileSize } from '@/lib/utils/imageOptimization';

export default function AdminHeroImagesPage() {
  const t = useTranslations('admin');
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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
    if (!confirm(t('confirmDeleteHeroImage'))) {
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setIsReordering(true);

    // Optimistic update
    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, removed);
    setImages(newImages);

    setDraggedIndex(null);
    setDragOverIndex(null);

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
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white">{t('loading')}</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-6 sm:py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin/site-images"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToSiteImages')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('heroImages')}</h1>
              <p className="text-sm sm:text-base text-neutral-400">{t('manageHeroImages')}</p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-white text-black rounded-sm hover:bg-neutral-100 transition-colors text-sm font-medium self-start sm:self-auto"
            >
              {t('addImage')}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 p-4 sm:p-6 border border-white/10 bg-black/50 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              {editingImage ? t('editImage') : t('addNewImage')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File upload - available for both add and edit */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {editingImage ? t('replaceImageOptional') : t('uploadImageRequired')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-medium file:bg-white file:text-black hover:file:bg-neutral-100 disabled:opacity-50"
                />
                {uploadingImage && (
                  <p className="mt-2 text-sm text-neutral-400">{t('uploadingAndOptimizing')}</p>
                )}
                {editingImage && (
                  <p className="mt-2 text-xs text-neutral-500">
                    {t('leaveEmptyToKeepImage')}
                  </p>
                )}
              </div>

              {/* URL input - only shown when editing and no file is being uploaded */}
              {editingImage && !uploadingImage && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t('currentImageUrl')}
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
                    {t('toChangeImageUploadAbove')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t('altTextEn')}
                  </label>
                  <input
                    type="text"
                    value={formData.alt_text_en}
                    onChange={(e) => setFormData({ ...formData, alt_text_en: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    placeholder={t('descriptionForScreenReaders')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t('altTextSv')}
                  </label>
                  <input
                    type="text"
                    value={formData.alt_text_sv}
                    onChange={(e) => setFormData({ ...formData, alt_text_sv: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    placeholder={t('descriptionForScreenReadersSv')}
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
                  <span className="text-sm text-white">{t('activeVisibleOnHomepage')}</span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-sm text-red-200 text-sm">
                  {error}
                </div>
              )}

              {editingImage && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-white text-black rounded-sm hover:bg-neutral-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? t('saving') : t('update')}
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
                    {t('cancel')}
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
                    {t('cancel')}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Images List */}
        {images.length === 0 ? (
          <div className="text-center py-12 sm:py-16 border border-white/10 bg-black/50 rounded-lg px-4">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-600 mx-auto mb-4"
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
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{t('noHeroImages')}</h3>
            <p className="text-sm sm:text-base text-neutral-400 mb-6">
              {t('noHeroImagesDesc')}
            </p>
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-white text-black rounded-sm hover:bg-neutral-100 transition-colors text-sm font-medium"
            >
              {t('addFirstImage')}
            </button>
          </div>
        ) : (
          <>
            {images.length > 1 && (
              <p className="text-sm text-neutral-400 mb-4">
                {t('dragDropToReorder')}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable={images.length > 1 && !isReordering}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    draggedIndex === index
                      ? 'opacity-50 scale-95 border-white/30'
                      : dragOverIndex === index
                      ? 'border-white/50 bg-white/5 scale-[1.02]'
                      : 'border-white/10 bg-black/50'
                  } ${images.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <div className="relative aspect-[3/4] bg-neutral-900">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${image.url})` }}
                    />
                    {image.active === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{t('inactive')}</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      {images.length > 1 && (
                        <div className="p-1.5 bg-black/70 rounded cursor-grab">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="mb-3">
                      <p className="text-xs sm:text-sm text-neutral-400 mb-1">{t('altTextEn')}</p>
                      <p className="text-white text-xs sm:text-sm">
                        {image.alt_text_en || <span className="text-neutral-500">{t('notSet')}</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(image)}
                        className="flex-1 px-3 py-2 border border-white/20 text-white rounded-sm hover:bg-white/10 transition-colors text-xs sm:text-sm"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="px-3 py-2 border border-red-500/50 text-red-400 rounded-sm hover:bg-red-500/10 transition-colors text-xs sm:text-sm"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

