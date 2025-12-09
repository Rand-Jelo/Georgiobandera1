'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';

interface ShippingRegion {
  id: string;
  name_en: string;
  name_sv: string;
  code: string;
}

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: {
    id: string;
    name_en: string;
    name_sv: string;
    price: number;
  } | null;
  variant: {
    id: string;
    name_en: string | null;
    name_sv: string | null;
    price: number | null;
  } | null;
}

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const locale = useLocale();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingRegions, setShippingRegions] = useState<ShippingRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    shippingName: '',
    shippingAddressLine1: '',
    shippingAddressLine2: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: 'SE',
    shippingPhone: '',
    shippingRegionId: '',
    paymentMethod: '' as 'stripe' | 'paypal' | '',
  });

  const [shippingCost, setShippingCost] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  useEffect(() => {
    if (formData.shippingRegionId && subtotal > 0) {
      calculateShipping();
    }
  }, [formData.shippingRegionId, subtotal]);

  const fetchData = async () => {
    try {
      // Fetch cart
      const cartResponse = await fetch('/api/cart');
      const cartData = await cartResponse.json() as { items?: CartItem[] };
      setCartItems(cartData.items || []);

      // Fetch shipping regions
      const regionsResponse = await fetch('/api/shipping/regions');
      const regionsData = await regionsResponse.json() as { regions?: ShippingRegion[] };
      setShippingRegions(regionsData.regions || []);

      // Set default region if available
      if (regionsData.regions && regionsData.regions.length > 0) {
        const defaultRegion = regionsData.regions.find(r => r.code === 'SE') || regionsData.regions[0];
        setFormData(prev => ({ ...prev, shippingRegionId: defaultRegion.id }));
        setSelectedRegion(defaultRegion);
      }
    } catch (err) {
      console.error('Error fetching checkout data:', err);
      setError('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = async () => {
    const currentSubtotal = cartItems.reduce((sum, item) => {
      const price = item.variant?.price ?? item.product?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);

    if (!formData.shippingRegionId || currentSubtotal === 0) return;

    try {
      const region = shippingRegions.find(r => r.id === formData.shippingRegionId);
      if (!region) return;

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionCode: region.code,
          subtotal: currentSubtotal,
        }),
      });

      const data = await response.json() as { shippingCost?: number };
      if (data.shippingCost !== undefined) {
        setShippingCost(data.shippingCost);
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
    }
  };

  const tax = subtotal * 0.25; // 25% VAT
  const total = subtotal + shippingCost + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      setProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { order?: { id: string; order_number: string }; error?: string };

      if (data.error) {
        setError(data.error);
        setProcessing(false);
        return;
      }

      if (data.order) {
        // Redirect to order confirmation
        // Payment processing will be handled via webhooks when payment integrations are added
        router.push(`/orders/${data.order.order_number}`);
      }
    } catch (err) {
      setError('Failed to create order. Please try again.');
      setProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'shippingRegionId') {
      const region = shippingRegions.find(r => r.id === value);
      setSelectedRegion(region || null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push('/shop')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>

        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-7">
            {/* Shipping Information */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('shippingInfo')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="shippingName" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="shippingName"
                    name="shippingName"
                    required
                    value={formData.shippingName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="shippingAddressLine1" className="block text-sm font-medium text-gray-700">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="shippingAddressLine1"
                    name="shippingAddressLine1"
                    required
                    value={formData.shippingAddressLine1}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="shippingAddressLine2" className="block text-sm font-medium text-gray-700">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="shippingAddressLine2"
                    name="shippingAddressLine2"
                    value={formData.shippingAddressLine2}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shippingCity" className="block text-sm font-medium text-gray-700">
                      City *
                    </label>
                    <input
                      type="text"
                      id="shippingCity"
                      name="shippingCity"
                      required
                      value={formData.shippingCity}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="shippingPostalCode" className="block text-sm font-medium text-gray-700">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="shippingPostalCode"
                      name="shippingPostalCode"
                      required
                      value={formData.shippingPostalCode}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="shippingCountry" className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <select
                    id="shippingCountry"
                    name="shippingCountry"
                    required
                    value={formData.shippingCountry}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="shippingPhone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="shippingPhone"
                    name="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="shippingRegionId" className="block text-sm font-medium text-gray-700">
                    Shipping Region *
                  </label>
                  <select
                    id="shippingRegionId"
                    name="shippingRegionId"
                    required
                    value={formData.shippingRegionId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select region</option>
                    {shippingRegions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {locale === 'sv' ? region.name_sv : region.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('paymentMethod')}
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={formData.paymentMethod === 'stripe'}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard, Amex, Klarna</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">PayPal</div>
                    <div className="text-sm text-gray-500">Pay with your PayPal account</div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-white shadow rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('orderSummary')}
              </h2>

              {/* Order Items */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                {cartItems.map((item) => {
                  const price = item.variant?.price ?? item.product?.price ?? 0;
                  const name = locale === 'sv'
                    ? item.product?.name_sv || item.product?.name_en || ''
                    : item.product?.name_en || '';
                  const variantName = locale === 'sv'
                    ? item.variant?.name_sv || item.variant?.name_en
                    : item.variant?.name_en;

                  return (
                    <div key={item.id} className="flex justify-between text-sm mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{name}</p>
                        {variantName && (
                          <p className="text-gray-500 text-xs">{variantName}</p>
                        )}
                        <p className="text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {formatPrice(price * item.quantity, 'SEK')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">{tCart('subtotal')}</dt>
                  <dd className="text-gray-900">{formatPrice(subtotal, 'SEK')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{tCart('shipping')}</dt>
                  <dd className="text-gray-900">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(shippingCost, 'SEK')
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Tax (VAT)</dt>
                  <dd className="text-gray-900">{formatPrice(tax, 'SEK')}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                  <dt className="text-gray-900">{tCart('total')}</dt>
                  <dd className="text-gray-900">{formatPrice(total, 'SEK')}</dd>
                </div>
              </dl>

              <button
                type="submit"
                disabled={processing}
                className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? t('processing') : t('placeOrder')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

