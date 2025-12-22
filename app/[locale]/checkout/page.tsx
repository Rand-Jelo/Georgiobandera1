'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { COUNTRIES } from '@/lib/constants/countries';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import StripePayment from '@/components/payment/StripePayment';
import PayPalPayment from '@/components/payment/PayPalPayment';

interface ShippingRegion {
  id: string;
  name_en: string;
  name_sv: string;
  code: string;
  base_price: number;
  free_shipping_threshold: number | null;
  active: boolean;
  created_at: number;
  updated_at: number;
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

  const [shippingCost, setShippingCost] = useState<number | null>(null); // null means not calculated yet
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion | null>(null);
  const [taxRate, setTaxRate] = useState(0.25); // Default 25%
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  
  // Payment state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTaxRate();
  }, []);

  const fetchTaxRate = async () => {
    try {
      const response = await fetch('/api/checkout/tax');
      const data = await response.json() as { taxRate?: number };
      if (data.taxRate) {
        setTaxRate(data.taxRate);
      }
    } catch (err) {
      console.error('Error fetching tax rate:', err);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const detectShippingRegion = async (countryCode: string) => {
    try {
      const response = await fetch('/api/shipping/detect-region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryCode }),
      });

      const data = await response.json() as { 
        region?: { 
          id: string; 
          name_en: string; 
          name_sv: string; 
          code: string;
          base_price: number;
          free_shipping_threshold: number | null;
          active: boolean;
        }; 
        error?: string 
      };

      if (data.region) {
        // Find the full region object from the fetched regions (preferred)
        const fullRegion = shippingRegions.find(r => r.id === data.region!.id);
        if (fullRegion) {
          setFormData(prev => ({ ...prev, shippingRegionId: fullRegion.id }));
          setSelectedRegion(fullRegion);
        } else {
          // If not found in local state, use the region from API response
          setFormData(prev => ({ ...prev, shippingRegionId: data.region!.id }));
          setSelectedRegion({
            id: data.region.id,
            name_en: data.region.name_en,
            name_sv: data.region.name_sv,
            code: data.region.code,
            base_price: data.region.base_price,
            free_shipping_threshold: data.region.free_shipping_threshold,
            active: data.region.active,
            created_at: 0,
            updated_at: 0,
          });
        }
      } else {
        setFormData(prev => ({ ...prev, shippingRegionId: '' }));
        setSelectedRegion(null);
        setShippingCost(null);
      }
    } catch (err) {
      console.error('Error detecting shipping region:', err);
      setFormData(prev => ({ ...prev, shippingRegionId: '' }));
      setSelectedRegion(null);
      setShippingCost(null);
    }
  };

  // Calculate shipping when region is selected and address is complete
  useEffect(() => {
    const isAddressComplete = 
      formData.shippingName &&
      formData.shippingAddressLine1 &&
      formData.shippingCity &&
      formData.shippingPostalCode &&
      formData.shippingCountry &&
      formData.shippingRegionId;

    if (isAddressComplete && subtotal > 0) {
      calculateShipping();
    } else {
      // Hide shipping cost if address is incomplete
      setShippingCost(null);
    }
  }, [formData.shippingRegionId, formData.shippingName, formData.shippingAddressLine1, formData.shippingCity, formData.shippingPostalCode, formData.shippingCountry, subtotal]);

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

      // Don't set default region - let it be auto-matched when country is selected
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

    if (!formData.shippingRegionId || currentSubtotal === 0) {
      setShippingCost(null);
      return;
    }

    try {
      const region = shippingRegions.find(r => r.id === formData.shippingRegionId);
      if (!region) {
        setShippingCost(null);
        return;
      }

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
      } else {
        setShippingCost(null);
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
      setShippingCost(null);
    }
  };

  // Calculate tax from tax-inclusive prices
  // Tax = subtotal * (tax_rate / (1 + tax_rate))
  const tax = taxRate > 0 ? subtotal * (taxRate / (1 + taxRate)) : 0;
  // Apply discount if available
  const discountAmount = appliedDiscount?.amount || 0;
  // Subtotal already includes tax, so total = subtotal - discount + shipping
  // Tax is shown separately for transparency
  // Use 0 for shipping if not calculated yet
  const total = subtotal - discountAmount + (shippingCost ?? 0);

  // Initialize payment when method is selected and address is complete
  useEffect(() => {
    if (!formData.paymentMethod || shippingCost === null || total <= 0) {
      setStripeClientSecret(null);
      setPaypalOrderId(null);
      return;
    }

    const initializePayment = async () => {
      try {
        if (formData.paymentMethod === 'stripe') {
          const response = await fetch('/api/payments/stripe/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shippingRegionId: formData.shippingRegionId,
              discountCode: appliedDiscount?.code || null,
            }),
          });

          const data = await response.json() as { 
            clientSecret?: string; 
            paymentIntentId?: string; 
            error?: string;
            details?: string;
          };
          
          if (data.error) {
            const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
            setError(errorMsg);
            console.error('Stripe payment intent error:', data);
            return;
          }

          if (data.clientSecret) {
            setStripeClientSecret(data.clientSecret);
          }
        } else if (formData.paymentMethod === 'paypal') {
          const response = await fetch('/api/payments/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shippingRegionId: formData.shippingRegionId,
              discountCode: appliedDiscount?.code || null,
            }),
          });

          const data = await response.json() as { orderId?: string; status?: string; error?: string };
          
          if (data.error) {
            setError(data.error);
            return;
          }

          if (data.orderId) {
            setPaypalOrderId(data.orderId);
          }
        }
      } catch (err) {
        console.error('Error initializing payment:', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    initializePayment();
  }, [formData.paymentMethod, formData.shippingRegionId, shippingCost, total, appliedDiscount]);

  const handlePaymentSuccess = async (paymentId: string) => {
    setPaymentProcessing(true);
    setError('');

    try {
      // Create order with payment confirmation
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentIntentId: formData.paymentMethod === 'stripe' ? paymentId : undefined,
          paypalOrderId: formData.paymentMethod === 'paypal' ? paymentId : undefined,
          discountCode: appliedDiscount?.code || null,
        }),
      });

      const data = await response.json() as { order?: { id: string; order_number: string }; error?: string };

      if (data.error) {
        setError(data.error);
        setPaymentProcessing(false);
        return;
      }

      if (data.order) {
        router.push(`/orders/${data.order.order_number}`);
      }
    } catch (err) {
      setError('Failed to create order. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setPaymentProcessing(false);
  };

  // Auto-detect shipping region when country changes
  useEffect(() => {
    if (formData.shippingCountry) {
      detectShippingRegion(formData.shippingCountry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.shippingCountry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // When country changes, auto-detect shipping region
    if (name === 'shippingCountry') {
      detectShippingRegion(value);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setValidatingDiscount(true);
    setDiscountError('');

    try {
      const response = await fetch('/api/checkout/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          subtotal,
        }),
      });

      const data = await response.json() as {
        valid?: boolean;
        discountCode?: { code: string };
        discountAmount?: number;
        error?: string;
      };

      if (!response.ok || !data.valid) {
        setDiscountError(data.error || 'Invalid discount code');
        setAppliedDiscount(null);
        return;
      }

      if (data.discountAmount !== undefined && data.discountCode) {
        setAppliedDiscount({
          code: data.discountCode.code,
          amount: data.discountAmount,
        });
        setDiscountError('');
      }
    } catch (err) {
      console.error('Error validating discount code:', err);
      setDiscountError('Failed to validate discount code');
      setAppliedDiscount(null);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setAppliedDiscount(null);
    setDiscountError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-500 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-neutral-600 mb-6 font-medium">Your cart is empty</p>
          <button
            onClick={() => router.push('/shop')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-light tracking-tight text-neutral-900 mb-12">{t('title')}</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {t('shippingInfo')}
                  </h2>
                </div>
              </div>
              <div className="p-6">

                <div className="space-y-5">
                  <div>
                    <label htmlFor="shippingName" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="shippingName"
                      name="shippingName"
                      required
                      value={formData.shippingName}
                      onChange={handleChange}
                      className="block w-full px-5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="shippingAddressLine1" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="shippingAddressLine1"
                      name="shippingAddressLine1"
                      required
                      value={formData.shippingAddressLine1}
                      onChange={handleChange}
                      className="block w-full px-5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="shippingAddressLine2" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                      Address Line 2 <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="shippingAddressLine2"
                      name="shippingAddressLine2"
                      value={formData.shippingAddressLine2}
                      onChange={handleChange}
                      className="block w-full px-5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="shippingCity" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="shippingCity"
                        name="shippingCity"
                        required
                        value={formData.shippingCity}
                        onChange={handleChange}
                        className="block w-full px-5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="shippingPostalCode" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="shippingPostalCode"
                        name="shippingPostalCode"
                        required
                        value={formData.shippingPostalCode}
                        onChange={handleChange}
                        className="block w-full px-5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="shippingCountry" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="shippingCountry"
                      name="shippingCountry"
                      required
                      value={formData.shippingCountry}
                      onChange={handleChange}
                      className="block w-full px-5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                    >
                      <option value="">Select a country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="shippingPhone" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                      Phone <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="shippingPhone"
                      name="shippingPhone"
                      value={formData.shippingPhone}
                      onChange={handleChange}
                      className="block w-full px-5 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                    />
                  </div>

                  {selectedRegion && (
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Shipping Region</p>
                          <p className="text-sm font-semibold text-neutral-900">
                            {locale === 'sv' ? selectedRegion.name_sv : selectedRegion.name_en}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Base Price</p>
                          <p className="text-sm font-semibold text-neutral-900">
                            {formatPrice(selectedRegion.base_price, 'SEK')}
                          </p>
                        </div>
                      </div>
                      {selectedRegion.free_shipping_threshold && (
                        <p className="mt-2 text-xs text-neutral-500">
                          Free shipping on orders over {formatPrice(selectedRegion.free_shipping_threshold, 'SEK')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {t('paymentMethod')}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <label className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.paymentMethod === 'stripe'
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={formData.paymentMethod === 'stripe'}
                      onChange={handleChange}
                      className="h-5 w-5 text-neutral-900 focus:ring-neutral-900"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-neutral-900">Credit/Debit Card</div>
                      <div className="text-sm text-neutral-500 mt-1">Visa, Mastercard, Amex, Klarna</div>
                    </div>
                  </label>

                  <label className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.paymentMethod === 'paypal'
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleChange}
                      className="h-5 w-5 text-neutral-900 focus:ring-neutral-900"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-neutral-900">PayPal</div>
                      <div className="text-sm text-neutral-500 mt-1">Pay with your PayPal account</div>
                    </div>
                  </label>
                </div>

                {/* Payment Forms */}
                {formData.paymentMethod === 'stripe' && stripeClientSecret && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <StripePaymentWrapper
                      clientSecret={stripeClientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={paymentProcessing || shippingCost === null}
                    />
                  </div>
                )}

                {formData.paymentMethod === 'paypal' && paypalOrderId && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <PayPalPaymentWrapper
                      orderId={paypalOrderId}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={paymentProcessing || shippingCost === null}
                      total={total}
                    />
                  </div>
                )}

                {formData.paymentMethod && shippingCost === null && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500 text-center">
                      Please complete your shipping address to proceed with payment
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50/50 border border-red-200/50 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden sticky top-8">
              <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {t('orderSummary')}
                  </h2>
                </div>
              </div>
              <div className="p-6">

                {/* Order Items */}
                <div className="border-b border-neutral-200 pb-6 mb-6">
                  {cartItems.map((item) => {
                    const price = item.variant?.price ?? item.product?.price ?? 0;
                    const name = locale === 'sv'
                      ? item.product?.name_sv || item.product?.name_en || ''
                      : item.product?.name_en || '';
                    const variantName = locale === 'sv'
                      ? item.variant?.name_sv || item.variant?.name_en
                      : item.variant?.name_en;

                    return (
                      <div key={item.id} className="flex justify-between text-sm mb-4 last:mb-0">
                        <div className="flex-1 pr-4">
                          <p className="font-semibold text-neutral-900">{name}</p>
                          {variantName && (
                            <p className="text-neutral-500 text-xs mt-0.5">{variantName}</p>
                          )}
                          <p className="text-neutral-500 text-xs mt-1">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-neutral-900 font-semibold whitespace-nowrap">
                          {formatPrice(price * item.quantity, 'SEK')}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Discount Code */}
                <div className="border-b border-neutral-200 pb-6 mb-6">
                  {!appliedDiscount ? (
                    <div className="space-y-3">
                      <label htmlFor="discountCode" className="block text-sm font-medium text-neutral-700 tracking-wide">
                        Discount Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="discountCode"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          disabled={validatingDiscount || !discountCode.trim()}
                          className="px-6 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {validatingDiscount ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'Apply'}
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {discountError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Discount Applied: {appliedDiscount.code}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          -{formatPrice(appliedDiscount.amount, 'SEK')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 font-medium">Subtotal (incl. VAT)</dt>
                    <dd className="text-neutral-900 font-semibold">{formatPrice(subtotal, 'SEK')}</dd>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-green-600">
                      <dt className="font-medium">Discount ({appliedDiscount.code})</dt>
                      <dd className="font-semibold">-{formatPrice(appliedDiscount.amount, 'SEK')}</dd>
                    </div>
                  )}
                  {shippingCost !== null ? (
                    <div className="flex justify-between">
                      <dt className="text-neutral-600 font-medium">{tCart('shipping')}</dt>
                      <dd className="text-neutral-900 font-semibold">
                        {shippingCost === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          formatPrice(shippingCost, 'SEK')
                        )}
                      </dd>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <dt className="text-neutral-600 font-medium">{tCart('shipping')}</dt>
                      <dd className="text-neutral-500 text-xs italic">
                        {formData.shippingName && formData.shippingAddressLine1 && formData.shippingCity && formData.shippingPostalCode && formData.shippingCountry
                          ? 'Calculating...'
                          : 'Enter address to calculate'
                        }
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-200">
                    <dt>VAT included in subtotal</dt>
                    <dd>{formatPrice(tax, 'SEK')}</dd>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-neutral-200 pt-3 mt-3">
                    <dt className="text-neutral-900">{tCart('total')}</dt>
                    <dd className="text-neutral-900">
                      {shippingCost !== null ? (
                        formatPrice(total, 'SEK')
                      ) : (
                        <span className="text-neutral-500 text-sm font-normal italic">
                          {formatPrice(subtotal - discountAmount, 'SEK')} + shipping
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>

                {(!formData.paymentMethod || (formData.paymentMethod === 'stripe' && !stripeClientSecret) || (formData.paymentMethod === 'paypal' && !paypalOrderId)) && (
                  <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <p className="text-sm text-neutral-600 text-center">
                      {!formData.paymentMethod 
                        ? 'Please select a payment method above'
                        : 'Initializing payment...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stripe Payment Wrapper Component
function StripePaymentWrapper({ clientSecret, onSuccess, onError, disabled }: { 
  clientSecret: string; 
  onSuccess: (id: string) => void; 
  onError: (error: string) => void;
  disabled?: boolean;
}) {
  const stripePromise = useMemo(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  if (!stripePromise) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to environment variables.</p>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#171717',
        colorBackground: '#ffffff',
        colorText: '#171717',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePayment
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
      />
    </Elements>
  );
}

// PayPal Payment Wrapper Component
function PayPalPaymentWrapper({ orderId, onSuccess, onError, disabled, total }: { 
  orderId: string; 
  onSuccess: (id: string) => void; 
  onError: (error: string) => void;
  disabled?: boolean;
  total: number;
}) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">PayPal is not configured. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID to environment variables.</p>
      </div>
    );
  }

  const isProduction = !paypalClientId.includes('sandbox') && !paypalClientId.includes('test');
  const currency = 'SEK';

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency,
        intent: 'capture',
        components: 'buttons',
      }}
    >
      <PayPalPayment
        orderId={orderId}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
        total={total}
      />
    </PayPalScriptProvider>
  );
}

