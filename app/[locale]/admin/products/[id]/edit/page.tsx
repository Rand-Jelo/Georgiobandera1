'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Category, Product, ProductImage } from '@/types/database';
import { optimizeImage, formatFileSize } from '@/lib/utils/imageOptimization';
import ColorPicker from '@/components/admin/ColorPicker';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

type TabType = 'basic' | 'pricing' | 'variants' | 'images';

export default function EditProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const productId = params.id as string;
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
  const [sizeVariants, setSizeVariants] = useState<Array<{
    id?: string;
    value: string;
    sku: string;
    price: string;
    stock_quantity: string;
    track_inventory: boolean;
  }>>([]);
  const [colorVariants, setColorVariants] = useState<Array<{
    id?: string;
    name: string;
    hex: string;
    sku: string;
    price: string;
    stock_quantity: string;
    track_inventory: boolean;
  }>>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [productId]);

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
      await Promise.all([fetchCategories(), fetchProduct(), fetchImages()]);
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

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (!response.ok) {
        setError('Product not found');
        return;
      }

      const data = await response.json() as { product?: Product; variants?: any[] };
      if (data.product) {
        // Convert database boolean values (0/1) to actual booleans
        const featured = typeof data.product.featured === 'number' 
          ? data.product.featured === 1 
          : Boolean(data.product.featured);
        const trackInventory = typeof data.product.track_inventory === 'number'
          ? data.product.track_inventory === 1
          : Boolean(data.product.track_inventory);

        setFormData({
          name_en: data.product.name_en,
          name_sv: data.product.name_sv,
          slug: data.product.slug,
          description_en: data.product.description_en || '',
          description_sv: data.product.description_sv || '',
          category_id: data.product.category_id || '',
          price: data.product.price.toString(),
          compare_at_price: data.product.compare_at_price?.toString() || '',
          sku: data.product.sku || '',
          status: data.product.status,
          featured: featured,
          stock_quantity: data.product.stock_quantity.toString(),
          track_inventory: trackInventory,
        });

        // Load variants - separate sizes and colors
        if (data.variants) {
          const sizes: typeof sizeVariants = [];
          const colors: typeof colorVariants = [];
          
          data.variants.forEach((v: any) => {
            // Check if it's a size variant (option1_name is "Size" or similar)
            if (v.option1_name && (v.option1_name.toLowerCase() === 'size' || v.option1_name.toLowerCase() === 'sizes')) {
              sizes.push({
                id: v.id,
                value: v.option1_value || '',
                sku: v.sku || '',
                price: v.price ? v.price.toString() : '',
                stock_quantity: v.stock_quantity?.toString() || '0',
                track_inventory: v.track_inventory !== false,
              });
            }
            // Check if it's a color variant (option2_name is "Color" or similar, or option1_name is "Color")
            else if ((v.option2_name && (v.option2_name.toLowerCase() === 'color' || v.option2_name.toLowerCase() === 'colors')) ||
                     (v.option1_name && (v.option1_name.toLowerCase() === 'color' || v.option1_name.toLowerCase() === 'colors'))) {
              const colorValue = v.option2_value || v.option1_value || '';
              // Check if it's a hex color
              const hexMatch = colorValue.match(/^#([0-9A-Fa-f]{6})$/);
              colors.push({
                id: v.id,
                name: hexMatch ? colorValue : colorValue,
                hex: hexMatch ? colorValue : '#000000',
                sku: v.sku || '',
                price: v.price ? v.price.toString() : '',
                stock_quantity: v.stock_quantity?.toString() || '0',
                track_inventory: v.track_inventory !== false,
              });
            }
          });
          
          setSizeVariants(sizes);
          setColorVariants(colors);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/images`);
      const data = await response.json() as { images?: ProductImage[] };
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json() as { error?: string; image?: ProductImage };

      if (!response.ok) {
        alert(data.error || 'Failed to upload image');
        setUploadingImage(false);
        return;
      }

      await fetchImages();
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
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (!response.ok) {
        alert(data.error || 'Failed to delete image');
        return;
      }

      await fetchImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('An error occurred while deleting the image.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addSizeVariant = () => {
    setSizeVariants((prev) => [
      ...prev,
      {
        value: '',
        sku: '',
        price: '',
        stock_quantity: '0',
        track_inventory: true,
      },
    ]);
  };

  const removeSizeVariant = (index: number) => {
    setSizeVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSizeVariant = (index: number, field: string, value: string | boolean) => {
    setSizeVariants((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    );
  };

  const addColorVariant = () => {
    setColorVariants((prev) => [
      ...prev,
      {
        name: '',
        hex: '#000000',
        sku: '',
        price: '',
        stock_quantity: '0',
        track_inventory: true,
      },
    ]);
  };

  const removeColorVariant = (index: number) => {
    setColorVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateColorVariant = (index: number, field: string, value: string | boolean) => {
    setColorVariants((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_en: formData.name_en,
          name_sv: formData.name_sv,
          slug: formData.slug,
          description_en: formData.description_en || null,
          description_sv: formData.description_sv || null,
          category_id: formData.category_id || null,
          price: parseFloat(formData.price) || 0,
          compare_at_price: formData.compare_at_price ? (parseFloat(formData.compare_at_price) || null) : null,
          sku: formData.sku || null,
          status: formData.status,
          featured: Boolean(formData.featured),
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          track_inventory: Boolean(formData.track_inventory),
          variants: [
            // Size variants
            ...sizeVariants.map(v => ({
              id: v.id,
              option1_name: 'Size',
              option1_value: v.value || null,
              option2_name: null,
              option2_value: null,
              sku: v.sku || null,
              price: v.price && !isNaN(parseFloat(v.price)) ? parseFloat(v.price) : null,
              stock_quantity: parseInt(v.stock_quantity) || 0,
              track_inventory: Boolean(v.track_inventory),
            })),
            // Color variants
            ...colorVariants.map(v => ({
              id: v.id,
              option1_name: null,
              option1_value: null,
              option2_name: 'Color',
              option2_value: v.hex || v.name || null,
              sku: v.sku || null,
              price: v.price && !isNaN(parseFloat(v.price)) ? parseFloat(v.price) : null,
              stock_quantity: parseInt(v.stock_quantity) || 0,
              track_inventory: Boolean(v.track_inventory),
            })),
          ],
        }),
      });

      const data = await response.json() as { error?: string; details?: any; product?: any };

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to update product';
        if (data.details && Array.isArray(data.details)) {
          errorMessage += '\n\nValidation errors:\n' + data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n');
        }
        setError(errorMessage);
        setSaving(false);
        return;
      }

      router.push('/admin/products');
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link
            href="/admin/products"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Products
          </Link>
          <h1 className="text-4xl font-semibold text-white mb-2">Edit Product</h1>
          <p className="text-neutral-400">Update product information</p>
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
              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`px-6 py-4 text-sm font-medium transition-all relative ${
                  activeTab === 'pricing'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <span>Pricing & Inventory</span>
                {activeTab === 'pricing' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                className={`px-6 py-4 text-sm font-medium transition-all relative ${
                  activeTab === 'variants'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <span>Variants</span>
                {activeTab === 'variants' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={`px-6 py-4 text-sm font-medium transition-all relative ${
                  activeTab === 'images'
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <span>Images</span>
                {activeTab === 'images' && (
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
                  <h2 className="text-xl font-semibold text-white mb-4">Product Information</h2>
                  <div className="space-y-6">
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
                onChange={handleChange}
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
                  </div>
                </div>
              </div>
            )}

            {/* Pricing & Inventory Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Pricing & Inventory</h2>
                  <div className="space-y-6">
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
                  </div>
                </div>
              </div>
            )}

            {/* Variants Tab */}
            {activeTab === 'variants' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Product Variants</h2>
                  
                  {/* Size Variants */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">Size Variants</h3>
                        <p className="text-sm text-neutral-400">Add independent size options (S, M, L, etc.)</p>
                      </div>
                      <button
                        type="button"
                        onClick={addSizeVariant}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 transition-colors"
                      >
                        + Add Size
                      </button>
                    </div>

                    {sizeVariants.length === 0 ? (
                      <div className="p-6 border border-white/10 rounded-lg bg-black/30 text-center">
                        <p className="text-neutral-400 text-sm">No size variants added. Click "Add Size" to add size options.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sizeVariants.map((variant, index) => (
                          <div
                            key={variant.id || `size-${index}`}
                            className="p-5 rounded-lg border border-white/10 bg-black/30"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-white">Size Variant {index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeSizeVariant(index)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">
                                  Size Value *
                                </label>
                                <input
                                  type="text"
                                  value={variant.value}
                                  onChange={(e) => updateSizeVariant(index, 'value', e.target.value)}
                                  placeholder="S, M, L, XL"
                                  required
                                  className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">
                                  SKU
                                </label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateSizeVariant(index, 'sku', e.target.value)}
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
                                  onChange={(e) => updateSizeVariant(index, 'price', e.target.value)}
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
                                  onChange={(e) => updateSizeVariant(index, 'stock_quantity', e.target.value)}
                                  className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.track_inventory}
                                  onChange={(e) => updateSizeVariant(index, 'track_inventory', e.target.checked)}
                                  className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                                />
                                <span className="text-xs text-neutral-300">Track inventory for this size</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Color Variants */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">Color Variants</h3>
                        <p className="text-sm text-neutral-400">Add independent color options with color picker</p>
                      </div>
                      <button
                        type="button"
                        onClick={addColorVariant}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 transition-colors"
                      >
                        + Add Color
                      </button>
                    </div>

                    {colorVariants.length === 0 ? (
                      <div className="p-6 border border-white/10 rounded-lg bg-black/30 text-center">
                        <p className="text-neutral-400 text-sm">No color variants added. Click "Add Color" to add color options.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {colorVariants.map((variant, index) => (
                          <div
                            key={variant.id || `color-${index}`}
                            className="p-5 rounded-lg border border-white/10 bg-black/30"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-white">Color Variant {index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeColorVariant(index)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">
                                  Color Name *
                                </label>
                                <input
                                  type="text"
                                  value={variant.name}
                                  onChange={(e) => updateColorVariant(index, 'name', e.target.value)}
                                  placeholder="Red, Blue, Black"
                                  required
                                  className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                              <div>
                                <ColorPicker
                                  value={variant.hex}
                                  onChange={(color) => updateColorVariant(index, 'hex', color)}
                                  label="Color"
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
                                  onChange={(e) => updateColorVariant(index, 'sku', e.target.value)}
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
                                  onChange={(e) => updateColorVariant(index, 'price', e.target.value)}
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
                                  onChange={(e) => updateColorVariant(index, 'stock_quantity', e.target.value)}
                                  className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.track_inventory}
                                  onChange={(e) => updateColorVariant(index, 'track_inventory', e.target.checked)}
                                  className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                                />
                                <span className="text-xs text-neutral-300">Track inventory for this color</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Product Images</h2>
                  
                  <div className="space-y-6">
                    <div>
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
                        <p className="mt-2 text-sm text-neutral-400">Uploading and optimizing image...</p>
                      )}
                    </div>

                    {images.length === 0 ? (
                      <div className="p-8 border border-white/10 rounded-lg bg-black/30 text-center">
                        <p className="text-neutral-400 text-sm">No images uploaded yet.</p>
                      </div>
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
                            <div className="mt-1 text-xs text-neutral-400 text-center">
                              Sort: {image.sort_order}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between px-8 py-6 border-t border-white/10 bg-black/30">
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

