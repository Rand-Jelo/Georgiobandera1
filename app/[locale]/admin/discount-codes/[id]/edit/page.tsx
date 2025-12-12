'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import type { DiscountCode } from '@/types/database';

export default function EditDiscountCodePage() {
  const router = useRouter();
  const params = useParams();
  const codeId = params.id as string;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    minimum_purchase: '',
    maximum_discount: '',
    usage_limit: '',
    user_usage_limit: '1',
    valid_from: '',
    valid_until: '',
    active: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [codeId]);

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
      fetchDiscountCode();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchDiscountCode = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/discount-codes/${codeId}`);
      if (!response.ok) {
        setError('Discount code not found');
        setLoading(false);
        return;
      }
      const data = await response.json() as { discountCode?: DiscountCode };
      if (data.discountCode) {
        setDiscountCode(data.discountCode);
        setFormData({
          code: data.discountCode.code,
          description: data.discountCode.description || '',
          discount_type: data.discountCode.discount_type,
          discount_value: data.discountCode.discount_value.toString(),
          minimum_purchase: data.discountCode.minimum_purchase.toString(),
          maximum_discount: data.discountCode.maximum_discount?.toString() || '',
          usage_limit: data.discountCode.usage_limit?.toString() || '',
          user_usage_limit: data.discountCode.user_usage_limit.toString(),
          valid_from: data.discountCode.valid_from
            ? new Date(data.discountCode.valid_from * 1000).toISOString().slice(0, 16)
            : '',
          valid_until: data.discountCode.valid_until
            ? new Date(data.discountCode.valid_until * 1000).toISOString().slice(0, 16)
            : '',
          active: Boolean(data.discountCode.active),
        });
      }
    } catch (error) {
      console.error('Error fetching discount code:', error);
      setError('Failed to load discount code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload: any = {
        code: formData.code.toUpperCase(),
        description: formData.description?.trim() || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        minimum_purchase: formData.minimum_purchase && formData.minimum_purchase.trim() ? parseFloat(formData.minimum_purchase) : 0,
        maximum_discount: formData.maximum_discount && formData.maximum_discount.trim() ? parseFloat(formData.maximum_discount) : null,
        usage_limit: formData.usage_limit && formData.usage_limit.trim() ? parseInt(formData.usage_limit, 10) : null,
        user_usage_limit: formData.user_usage_limit && formData.user_usage_limit.trim() ? parseInt(formData.user_usage_limit, 10) : 1,
        valid_from: formData.valid_from && formData.valid_from.trim() ? Math.floor(new Date(formData.valid_from).getTime() / 1000) : null,
        valid_until: formData.valid_until && formData.valid_until.trim() ? Math.floor(new Date(formData.valid_until).getTime() / 1000) : null,
        active: Boolean(formData.active),
      };

      // Validate percentage discount
      if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
        setError('Percentage discount cannot exceed 100%');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/discount-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as { discountCode?: DiscountCode; error?: string; details?: any };

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to update discount code';
        const detailsMsg = data.details ? ` Details: ${JSON.stringify(data.details)}` : '';
        setError(errorMsg + detailsMsg);
        setSaving(false);
        return;
      }

      router.push('/admin/discount-codes');
    } catch (error) {
      console.error('Error updating discount code:', error);
      const errorMsg = error instanceof Error ? error.message : 'An error occurred while updating the discount code';
      setError(errorMsg);
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

  if (error && !discountCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-red-400 text-lg">{error}</div>
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
            href="/admin/discount-codes"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Discount Codes
          </Link>
          <h1 className="text-4xl font-semibold text-white mb-2">Edit Discount Code</h1>
          <p className="text-neutral-400">Update discount code settings</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/50 border border-white/10 rounded-lg p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Discount Type <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Discount Value <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>

          {formData.discount_type === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Discount (SEK)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.maximum_discount}
                onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value })}
                className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Minimum Purchase (SEK)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.minimum_purchase}
              onChange={(e) => setFormData({ ...formData, minimum_purchase: e.target.value })}
              className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                min="1"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                User Usage Limit
              </label>
              <input
                type="number"
                min="1"
                value={formData.user_usage_limit}
                onChange={(e) => setFormData({ ...formData, user_usage_limit: e.target.value })}
                className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Valid From
              </label>
              <input
                type="datetime-local"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Valid Until
              </label>
              <input
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-black/50 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-white">Active</span>
            </label>
          </div>

          {discountCode && (
            <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Usage:</strong> {discountCode.usage_count}
                {discountCode.usage_limit !== null ? ` / ${discountCode.usage_limit}` : ' / ∞'}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/discount-codes"
              className="px-6 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-black/70 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

