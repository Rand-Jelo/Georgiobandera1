'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Category, ProductImage } from '@/types/database';
import { optimizeImage, formatFileSize } from '@/lib/utils/imageOptimization';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export default function NewProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name_en: '',
    name_sv: '',
    slug: '',
    description_en: '',
    description_sv: '',
    category_id: '',
    price: '',
    compare_at_price: '',
    sku: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    featured: false,
    stock_quantity: '0',
    track_inventory: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [variants, setVariants] = useState<Array<{
    id?: string;
    option1_name: string;
    option1_value: string;
    option2_name: string;
    option2_value: string;
    sku: string;
    price: string;
    stock_quantity: string;
    track_inventory: boolean;
  }>>([]);

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
      const response = await fetch('/api/categories');
      const data = await response.json() as { categories?: CategoryWithChildren[] };
      // Flatten categories for dropdown
      const flattenCategories = (cats: CategoryWithChildren[]): Category[] => {
        const result: Category[] = [];
        cats.forEach((cat) => {
          result.push(cat);
          if (cat.children) {
            result.push(...flattenCategories(cat.children));
          }
        });
        return result;
      };
      setCategories(flattenCategories(data.categories || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (field: 'name_en' | 'name_sv', value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from English name if slug is empty
      if (field === 'name_en' && !prev.slug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        option1_name: 'Size',
        option1_value: '',
        option2_name: 'Color',
        option2_value: '',
        sku: '',
        price: '',
        stock_quantity: '0',
        track_inventory: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string | boolean) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    );
  };

  const fetchImages = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/images`);
      const data = await response.json() as { images?: ProductImage[] };
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          category_id: formData.category_id || null,
          variants: variants.map(v => ({
            option1_name: v.option1_name || null,
            option1_value: v.option1_value || null,
            option2_name: v.option2_name || null,
            option2_value: v.option2_value || null,
            sku: v.sku || null,
            price: v.price ? parseFloat(v.price) : null,
            stock_quantity: parseInt(v.stock_quantity) || 0,
            track_inventory: v.track_inventory,
          })),
        }),
      });

      const data = await response.json() as { error?: string; product?: any; details?: any };

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to create product';
        if (data.details && Array.isArray(data.details)) {
          errorMessage += '\n\nValidation errors:\n' + data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n');
        }
        setError(errorMessage);
        setSaving(false);
        return;
      }

      // Set created product ID to enable image upload
      if (data.product?.id) {
        setCreatedProductId(data.product.id);
        // Fetch images (will be empty initially)
        await fetchImages(data.product.id);
      } else {
        router.push('/admin/products');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!createdProductId) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

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
      uploadFormData.append('alt_text_en', formData.name_en || '');
      uploadFormData.append('alt_text_sv', formData.name_sv || '');

      const response = await fetch(`/api/admin/products/${createdProductId}/images`, {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json() as { error?: string; image?: ProductImage };

      if (!response.ok) {
        alert(data.error || 'Failed to upload image');
        setUploadingImage(false);
        return;
      }

      await fetchImages(createdProductId);
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('An error occurred while uploading the image.');
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!createdProductId) return;
    
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${createdProductId}/images/${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (!response.ok) {
        alert(data.error || 'Failed to delete image');
        return;
      }

      await fetchImages(createdProductId);
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('An error occurred while deleting the image.');
    }
  };

  const handleContinue = () => {
    if (createdProductId) {
      router.push(`/admin/products/${createdProductId}/edit`);
    } else {
      router.push('/admin/products');
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
            href="/admin/products"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Products
          </Link>
          <h1 className="text-4xl font-semibold text-white mb-2">New Product</h1>
          <p className="text-neutral-400">Create a new product</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/50 border border-white/10 rounded-lg p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4">
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name_en" className="block text-sm font-medium text-neutral-300 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                id="name_en"
                name="name_en"
                required
                value={formData.name_en}
                onChange={(e) => handleNameChange('name_en', e.target.value)}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="name_sv" className="block text-sm font-medium text-neutral-300 mb-2">
                Product Name (Swedish) *
              </label>
              <input
                type="text"
                id="name_sv"
                name="name_sv"
                required
                value={formData.name_sv}
                onChange={(e) => handleNameChange('name_sv', e.target.value)}
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
            <p className="mt-1 text-xs text-neutral-500">URL-friendly identifier (auto-generated from name)</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-neutral-300 mb-2">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              >
                <option value="">No category</option>
                {categories.map((cat) => {
                  const name = locale === 'sv' ? cat.name_sv : cat.name_en;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-neutral-300 mb-2">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-neutral-300 mb-2">
                Price (SEK) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="compare_at_price" className="block text-sm font-medium text-neutral-300 mb-2">
                Compare at Price (SEK)
              </label>
              <input
                type="number"
                id="compare_at_price"
                name="compare_at_price"
                step="0.01"
                min="0"
                value={formData.compare_at_price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-300 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-neutral-300 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                min="0"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="track_inventory"
                  checked={formData.track_inventory}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                />
                <span className="text-sm text-neutral-300">Track inventory</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
              />
              <span className="text-sm text-neutral-300">Featured product</span>
            </label>
          </div>

          {/* Product Images Section - Only shown after product is created */}
          {createdProductId && (
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Product Images</h3>
                  <p className="text-sm text-neutral-400">Upload images for your product</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white file:text-black hover:file:bg-neutral-100 file:cursor-pointer disabled:opacity-50"
                />
                {uploadingImage && (
                  <p className="mt-2 text-sm text-neutral-400">Uploading...</p>
                )}
              </div>

              {images.length === 0 ? (
                <p className="text-neutral-400 text-sm">No images uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square bg-black/30 rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={image.url.startsWith('/api/images/') ? image.url : `/api${image.url}`}
                          alt={image.alt_text_en || 'Product image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded bg-red-500/80 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                      <div className="mt-1 text-xs text-neutral-400">
                        Sort: {image.sort_order}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Variants Section */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Product Variants (Size & Color)</h3>
              <button
                type="button"
                onClick={addVariant}
                className="px-4 py-2 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 transition-colors"
              >
                + Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-neutral-400 text-sm mb-4">
                No variants added. Click "Add Variant" to add size and color options.
              </p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-white/10 bg-black/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-white">Variant {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Size Label
                        </label>
                        <input
                          type="text"
                          value={variant.option1_name}
                          onChange={(e) => updateVariant(index, 'option1_name', e.target.value)}
                          placeholder="Size"
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Size Value
                        </label>
                        <input
                          type="text"
                          value={variant.option1_value}
                          onChange={(e) => updateVariant(index, 'option1_value', e.target.value)}
                          placeholder="S, M, L, XL"
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Color Label
                        </label>
                        <input
                          type="text"
                          value={variant.option2_name}
                          onChange={(e) => updateVariant(index, 'option2_name', e.target.value)}
                          placeholder="Color"
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Color Value
                        </label>
                        <input
                          type="text"
                          value={variant.option2_value}
                          onChange={(e) => updateVariant(index, 'option2_value', e.target.value)}
                          placeholder="Red, Blue, Black"
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          placeholder="Variant SKU"
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Price (SEK) - Optional
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', e.target.value)}
                          placeholder="Override base price"
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={variant.track_inventory}
                          onChange={(e) => updateVariant(index, 'track_inventory', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                        />
                        <span className="text-xs text-neutral-300">Track inventory for this variant</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
            {createdProductId ? (
              <>
                <Link
                  href="/admin/products"
                  className="px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Back to Products
                </Link>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-6 py-3 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/50 transition-all"
                >
                  Continue to Edit Page
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/admin/products"
                  className="px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? 'Creating...' : 'Create Product'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

