'use client';

import * as React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { optimizeImage, formatFileSize } from '@/lib/utils/imageOptimization';

interface SiteImage {
  id: string;
  section: string;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
  active: number;
  created_at: number;
  updated_at: number;
}

export default function AdminSiteImagesPage() {
  const t = useTranslations('admin');
  const router = useRouter();

  const SITE_SECTIONS = [
    { id: 'philosophy', name: t('ourPhilosophy'), description: t('philosophySectionDesc') },
    { id: 'about_hero', name: t('aboutPageHero'), description: t('aboutHeroDesc') },
  ];
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    alt_text_en: '',
    alt_text_sv: '',
    active: true,
  });
  const [uploading, setUploading] = useState(false);
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
      const response = await fetch('/api/admin/site-images', { cache: 'no-store' });
      const data = await response.json() as { images?: SiteImage[] };
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching site images:', error);
    }
  };

  const getImageForSection = (section: string): SiteImage | undefined => {
    return images.find(img => img.section === section);
  };

  const handleEdit = (section: string) => {
    const image = getImageForSection(section);
    setEditingSection(section);
    setFormData({
      alt_text_en: image?.alt_text_en || '',
      alt_text_sv: image?.alt_text_sv || '',
      active: image ? image.active === 1 : true,
    });
    setError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      // Optimize image before upload
      const originalSize = file.size;
      console.log(`Original image size: ${formatFileSize(originalSize)}`);

      const optimizedBlob = await optimizeImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        maxSizeKB: 400,
      });

      const optimizedSize = optimizedBlob.size;
      const compressionRatio = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      console.log(`Optimized image size: ${formatFileSize(optimizedSize)} (${compressionRatio}% reduction)`);

      const optimizedFile = new File([optimizedBlob], file.name, {
        type: file.type || 'image/jpeg',
        lastModified: Date.now(),
      });

      const uploadFormData = new FormData();
      uploadFormData.append('file', optimizedFile);
      uploadFormData.append('section', section);
      uploadFormData.append('alt_text_en', formData.alt_text_en || '');
      uploadFormData.append('alt_text_sv', formData.alt_text_sv || '');
      uploadFormData.append('active', formData.active.toString());

      const response = await fetch('/api/admin/site-images/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json() as { error?: string; image?: SiteImage };

      if (!response.ok) {
        setError(data.error || 'Failed to upload image');
        return;
      }

      setEditingSection(null);
      await fetchImages();
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('An error occurred while uploading the image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (section: string) => {
    if (!confirm(t('confirmDeleteImage'))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/site-images/${section}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        alert(data.error || 'Failed to delete image');
        return;
      }

      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleSaveMetadata = async (section: string) => {
    const image = getImageForSection(section);
    if (!image) return;

    try {
      const response = await fetch('/api/admin/site-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          url: image.url,
          alt_text_en: formData.alt_text_en || null,
          alt_text_sv: formData.alt_text_sv || null,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        setError(data.error || 'Failed to save');
        return;
      }

      setEditingSection(null);
      await fetchImages();
    } catch (error) {
      console.error('Error saving metadata:', error);
      setError('Failed to save');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
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
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToDashboard')}
          </Link>
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('siteImages')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('manageSiteImages')}</p>
        </div>

        {/* Hero Images Section */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin/hero-images"
            className="block bg-black/50 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">{t('homepageHeroCarousel')}</h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    {t('homepageHeroCarouselDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <span className="text-sm">{t('manageImages')}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Section Divider */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-medium text-neutral-500 uppercase tracking-wider">{t('sectionImages')}</h3>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {SITE_SECTIONS.map((section) => {
            const image = getImageForSection(section.id);
            const isEditing = editingSection === section.id;

            return (
              <div
                key={section.id}
                className="bg-black/50 border border-white/10 rounded-lg overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-white">{section.name}</h2>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1">{section.description}</p>
                    </div>
                    {image && !isEditing && (
                      <span
                        className={`self-start px-2 py-1 text-xs font-medium rounded-full ${
                          image.active === 1
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}
                      >
                        {image.active === 1 ? t('active') : t('inactive')}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      {error && (
                        <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                          {error}
                        </div>
                      )}

                      {/* Current image preview */}
                      {image && (
                        <div className="mb-4">
                          <p className="text-sm text-neutral-400 mb-2">{t('currentImage')}:</p>
                          <div className="relative w-32 h-32 sm:w-48 sm:h-48 bg-neutral-900 rounded-lg overflow-hidden">
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${image.url})` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* File upload */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          {image ? t('replaceImage') : t('uploadImage')}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, section.id)}
                          disabled={uploading}
                          className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white file:text-black hover:file:bg-neutral-100 disabled:opacity-50"
                        />
                        {uploading && (
                          <p className="mt-2 text-sm text-neutral-400">{t('uploadingAndOptimizing')}</p>
                        )}
                      </div>

                      {/* Alt text fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            {t('altTextEn')}
                          </label>
                          <input
                            type="text"
                            value={formData.alt_text_en}
                            onChange={(e) => setFormData({ ...formData, alt_text_en: e.target.value })}
                            className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
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
                            className="w-full px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                            placeholder={t('descriptionForScreenReadersSv')}
                          />
                        </div>
                      </div>

                      {/* Active toggle */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-white">{t('activeVisibleOnWebsite')}</span>
                        </label>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {image && (
                          <button
                            onClick={() => handleSaveMetadata(section.id)}
                            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 transition-colors text-sm font-medium"
                          >
                            {t('saveChanges')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingSection(null);
                            setError('');
                          }}
                          className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {image ? (
                        <>
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-neutral-900 rounded-lg overflow-hidden flex-shrink-0">
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${image.url})` }}
                            />
                          </div>
                          <div className="flex-grow">
                            <p className="text-xs sm:text-sm text-neutral-400">
                              Alt (EN): {image.alt_text_en || <span className="text-neutral-500">{t('notSet')}</span>}
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                              Alt (SV): {image.alt_text_sv || <span className="text-neutral-500">{t('notSet')}</span>}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(section.id)}
                              className="px-3 sm:px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors text-xs sm:text-sm"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(section.id)}
                              className="px-3 sm:px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-xs sm:text-sm"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                          <p className="text-neutral-500 italic text-sm">{t('noImageUploaded')}</p>
                          <button
                            onClick={() => handleEdit(section.id)}
                            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 transition-colors text-sm font-medium self-start sm:self-auto"
                          >
                            {t('uploadImage')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

