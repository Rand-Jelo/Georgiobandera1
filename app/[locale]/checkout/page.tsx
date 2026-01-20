'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { COUNTRIES } from '@/lib/constants/countries';
import { validateAddressFormat, validatePostalCode, formatPostalCode } from '@/lib/utils/address-validation';
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
    images?: Array<{
      id: string;
      url: string;
      alt_text_en?: string;
      alt_text_sv?: string;
      sort_order: number;
    }>;
  } | null;
  variant: {
    id: string;
    name_en: string | null;
    name_sv: string | null;
    price: number | null;
  } | null;
}

interface SavedAddress {
  id: string;
  user_id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: number;
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

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showSaveAddress, setShowSaveAddress] = useState(false);

  // Order notes and gift message
  const [orderNotes, setOrderNotes] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  // Multi-step checkout state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1: Shipping, 2: Payment, 3: Review

  // Address validation
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Guest checkout
  const [createAccount, setCreateAccount] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetchData();
    fetchTaxRate();
    fetchSavedAddresses();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      setIsLoggedIn(response.ok);
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  const fetchSavedAddresses = async () => {
    try {
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json() as { addresses?: SavedAddress[] };
        setSavedAddresses(data.addresses || []);
        // Don't auto-select - user must explicitly choose an address
      }
    } catch (err) {
      console.error('Error fetching saved addresses:', err);
    }
  };

  const handleSelectSavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setFormData({
      ...formData,
      shippingName: `${address.first_name} ${address.last_name}`,
      shippingAddressLine1: address.address_line1,
      shippingAddressLine2: address.address_line2 || '',
      shippingCity: address.city,
      shippingPostalCode: address.postal_code,
      shippingCountry: address.country,
      shippingPhone: address.phone || '',
    });
    detectShippingRegion(address.country);
  };

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

  // Initialize payment when method is selected, address is complete, and review is shown
  // Payment only initializes when review step is active (where payment forms are displayed)
  useEffect(() => {
    if (!formData.paymentMethod || shippingCost === null || total <= 0) {
      setStripeClientSecret(null);
      setPaypalOrderId(null);
      return;
    }

    // Only initialize payment when review step is shown (where payment forms are displayed)
    if (currentStep !== 3) {
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
        setError(t('failedToInitializePayment'));
      }
    };

    initializePayment();
  }, [formData.paymentMethod, formData.shippingRegionId, shippingCost, total, appliedDiscount, currentStep]);

  const handlePaymentSuccess = async (paymentId: string) => {
    setPaymentProcessing(true);
    setError('');

    try {
      // Save address if requested
      if (showSaveAddress && !selectedAddressId) {
        const nameParts = formData.shippingName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        try {
          await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              address_line1: formData.shippingAddressLine1,
              address_line2: formData.shippingAddressLine2 || undefined,
              city: formData.shippingCity,
              postal_code: formData.shippingPostalCode,
              country: formData.shippingCountry,
              phone: formData.shippingPhone || undefined,
              is_default: savedAddresses.length === 0, // Set as default if it's the first address
            }),
          });
        } catch (err) {
          console.error('Error saving address:', err);
          // Continue with order creation even if address save fails
        }
      }

      // Create order with payment confirmation
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentIntentId: formData.paymentMethod === 'stripe' ? paymentId : undefined,
          paypalOrderId: formData.paymentMethod === 'paypal' ? paymentId : undefined,
          discountCode: appliedDiscount?.code || null,
          orderNotes: orderNotes || undefined,
          giftMessage: giftMessage || undefined,
          guestEmail: guestEmail || undefined,
          createAccount: createAccount || false,
          locale: locale,
        }),
      });

      const data = await response.json() as { 
        order?: { id: string; order_number: string }; 
        error?: string;
        details?: string;
      };

      if (data.error) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        setError(errorMsg);
        console.error('Create order error:', data);
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

  const handlePlaceOrder = async () => {
    if (!formData.paymentMethod) {
      setError(t('pleaseSelectPaymentMethod'));
      return;
    }

    if (!isShippingComplete()) {
      setError(t('pleaseCompleteShippingInfo'));
      setCurrentStep(1);
      return;
    }

    // If payment method is selected, the payment forms should handle the order placement
    // This function is mainly for validation and triggering payment
    setProcessing(true);
    setError('');

    // The actual order placement happens in handlePaymentSuccess
    // which is called by the payment components after successful payment
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

    // Validate postal code when it changes
    if (name === 'shippingPostalCode' && formData.shippingCountry) {
      const validation = validatePostalCode(value, formData.shippingCountry);
      if (!validation.valid) {
        setAddressErrors(prev => ({ ...prev, shippingPostalCode: validation.errors[0] || 'Invalid postal code' }));
      } else {
        setAddressErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.shippingPostalCode;
          return newErrors;
        });
        // Auto-format postal code
        const formatted = formatPostalCode(value, formData.shippingCountry);
        if (formatted !== value) {
          setFormData(prev => ({ ...prev, shippingPostalCode: formatted }));
        }
      }
    }

    // Clear postal code error when country changes
    if (name === 'shippingCountry') {
      setAddressErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.shippingPostalCode;
        return newErrors;
      });
    }

    // When country changes, auto-detect shipping region
    if (name === 'shippingCountry') {
      detectShippingRegion(value);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError(t('pleaseEnterDiscountCode'));
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
        setDiscountError(data.error || t('invalidDiscountCode'));
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
      setDiscountError(t('failedToValidateDiscountCode'));
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

  // Validation functions
  const isShippingComplete = () => {
    return !!(
      formData.shippingName &&
      formData.shippingAddressLine1 &&
      formData.shippingCity &&
      formData.shippingPostalCode &&
      formData.shippingCountry &&
      formData.shippingRegionId &&
      shippingCost !== null
    );
  };

  const isPaymentComplete = () => {
    return !!formData.paymentMethod;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && isShippingComplete()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isPaymentComplete()) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-500 font-light">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        {/* Dark Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
          </div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 py-24">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="inline-block">
                <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                  Checkout
                </p>
                <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
              </div>
              <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl">
                {t('title')}
              </h1>
            </div>
          </div>
        </section>

        {/* Empty Cart */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto flex items-center justify-center mb-6">
              <svg className="w-full h-full text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-neutral-600 mb-6 font-light">{tCart('empty')}</p>
            <button
              onClick={() => router.push('/shop')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-light uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {tCart('continueShopping')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const steps = [
    { number: 1, label: t('shipping'), icon: 'location' },
    { number: 2, label: t('payment'), icon: 'payment' },
    { number: 3, label: t('review'), icon: 'check' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-6">
                <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                  {t('secureCheckout')}
                </p>
                <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
              </div>
              <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl mb-4">
                {t('title')}
              </h1>
            </div>

            {/* Progress Indicator */}
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.number;
                  const isCompleted = currentStep > step.number;
                  const isLast = index === steps.length - 1;

                  return (
                    <div key={step.number} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`relative flex items-center justify-center w-12 h-12 border-2 transition-all duration-300 ${
                          isActive || isCompleted
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-neutral-600 bg-transparent text-neutral-500'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : step.icon === 'location' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : step.icon === 'payment' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <span className={`mt-3 text-xs font-light uppercase tracking-wider hidden sm:block ${
                          isActive ? 'text-amber-400' : isCompleted ? 'text-neutral-400' : 'text-neutral-600'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {!isLast && (
                        <div className={`flex-1 h-px mx-4 transition-all duration-300 ${
                          isCompleted ? 'bg-amber-500' : 'bg-neutral-700'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column - Main Checkout Steps */}
            <div className="flex-1 space-y-8 min-w-0">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div className="bg-white border border-neutral-200/30 shadow-sm w-full">
                  <div className="px-10 py-8 border-b border-neutral-200/30">
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-neutral-900">
                      {t('shippingInfo')}
                    </h2>
                  </div>
                  <div className="p-10">
                    {/* Saved Addresses Selector */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-10 pb-10 border-b border-neutral-200/30">
                        <label className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                          Use Saved Address
                        </label>
                        <select
                          value={selectedAddressId || ''}
                          onChange={(e) => {
                            const addressId = e.target.value;
                            if (addressId) {
                              const address = savedAddresses.find(a => a.id === addressId);
                              if (address) {
                                handleSelectSavedAddress(address);
                              }
                            } else {
                              setSelectedAddressId(null);
                            }
                          }}
                          className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                        >
                          <option value="">Select a saved address...</option>
                          {savedAddresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.label || `${address.first_name} ${address.last_name}`} - {address.city}, {address.country}
                            </option>
                          ))}
                        </select>
                        {selectedAddressId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(null);
                              setFormData({
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
                            }}
                            className="mt-4 text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-light tracking-wide"
                          >
                            Use different address
                          </button>
                        )}
                      </div>
                    )}

                    <div className="space-y-8">
                      <div>
                        <label htmlFor="shippingName" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                          {t('fullName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="shippingName"
                          name="shippingName"
                          required
                          value={formData.shippingName}
                          onChange={handleChange}
                          className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                          placeholder={t('fullNamePlaceholder')}
                        />
                      </div>

                      <div>
                        <label htmlFor="shippingAddressLine1" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                          {t('addressLine1')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="shippingAddressLine1"
                          name="shippingAddressLine1"
                          required
                          value={formData.shippingAddressLine1}
                          onChange={handleChange}
                          className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                          placeholder={t('addressLine1Placeholder')}
                        />
                      </div>

                      <div>
                        <label htmlFor="shippingAddressLine2" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                          {t('addressLine2')} <span className="text-neutral-400 font-normal normal-case">({t('optional')})</span>
                        </label>
                        <input
                          type="text"
                          id="shippingAddressLine2"
                          name="shippingAddressLine2"
                          value={formData.shippingAddressLine2}
                          onChange={handleChange}
                          className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                          placeholder={t('addressLine2Placeholder')}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="shippingCity" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                            {t('city')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="shippingCity"
                            name="shippingCity"
                            required
                            value={formData.shippingCity}
                            onChange={handleChange}
                            className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                            placeholder={t('cityPlaceholder')}
                          />
                        </div>

                        <div>
                          <label htmlFor="shippingPostalCode" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                            {t('postalCode')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="shippingPostalCode"
                            name="shippingPostalCode"
                            required
                            value={formData.shippingPostalCode}
                            onChange={handleChange}
                            className={`block w-full px-6 py-4 border bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 transition-all text-sm font-light tracking-wide ${
                              addressErrors.shippingPostalCode
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-neutral-200/40 focus:ring-neutral-900 focus:border-neutral-900'
                            }`}
                            placeholder={t('postalCodePlaceholder')}
                          />
                          {addressErrors.shippingPostalCode && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-light">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {addressErrors.shippingPostalCode}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="shippingCountry" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                          {t('country')} <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="shippingCountry"
                          name="shippingCountry"
                          required
                          value={formData.shippingCountry}
                          onChange={handleChange}
                          className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                        >
                          <option value="">{t('selectCountry')}</option>
                          {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="shippingPhone" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                          {t('phone')} <span className="text-neutral-400 font-normal normal-case">({t('optional')})</span>
                        </label>
                        <input
                          type="tel"
                          id="shippingPhone"
                          name="shippingPhone"
                          value={formData.shippingPhone}
                          onChange={handleChange}
                          className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                          placeholder="+46 70 123 45 67"
                        />
                      </div>

                      {selectedRegion && (
                        <div className="bg-neutral-50 border border-neutral-200/30 p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('shippingRegion')}</p>
                              <p className="text-sm font-light text-neutral-900 tracking-wide">
                                {locale === 'sv' ? selectedRegion.name_sv : selectedRegion.name_en}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('basePrice')}</p>
                              <p className="text-sm font-light text-neutral-900 tracking-wide">
                                {formatPrice(selectedRegion.base_price, 'SEK')}
                              </p>
                            </div>
                          </div>
                          {selectedRegion.free_shipping_threshold && (
                            <p className="text-xs text-neutral-500 font-light tracking-wide pt-3 border-t border-neutral-200/30">
                              {t('freeShippingOver', { amount: formatPrice(selectedRegion.free_shipping_threshold, 'SEK') })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Save Address Option */}
                      {!selectedAddressId && (
                        <div className="flex items-center pt-2">
                          <input
                            type="checkbox"
                            id="saveAddress"
                            checked={showSaveAddress}
                            onChange={(e) => setShowSaveAddress(e.target.checked)}
                            className="h-4 w-4 text-neutral-900 focus:ring-neutral-900 border-neutral-300 rounded"
                          />
                          <label htmlFor="saveAddress" className="ml-3 text-sm text-neutral-700 font-light tracking-wide">
                            {t('saveAddressForFuture')}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Checkout - Email & Account Creation */}
              {currentStep === 1 && isLoggedIn === false && (
                <div className="bg-white border border-neutral-200/30 shadow-sm w-full">
                  <div className="px-10 py-8 border-b border-neutral-200/30">
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-neutral-900">
                      {t('contactInformation')}
                    </h2>
                  </div>
                  <div className="p-10 space-y-8">
                    <div>
                      <label htmlFor="guestEmail" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                        {t('emailAddress')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="guestEmail"
                        name="guestEmail"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder={t('emailPlaceholder')}
                        className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                      />
                      <p className="mt-3 text-xs text-neutral-500 font-light tracking-wide">
                        {t('orderConfirmationEmail')}
                      </p>
                    </div>

                    <div className="flex items-center pt-2">
                      <input
                        type="checkbox"
                        id="createAccount"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="h-4 w-4 text-neutral-900 focus:ring-neutral-900 border-neutral-300 rounded"
                      />
                      <label htmlFor="createAccount" className="ml-3 text-sm text-neutral-700 font-light tracking-wide">
                        {t('createAccountForFasterCheckout')}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes & Gift Message */}
              {currentStep === 1 && (
                <div className="bg-white border border-neutral-200/30 shadow-sm w-full">
                  <div className="px-10 py-8 border-b border-neutral-200/30">
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-neutral-900">
                      {t('additionalInformation')}
                    </h2>
                  </div>
                  <div className="p-10 space-y-8">
                    <div>
                      <label htmlFor="orderNotes" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                        {t('orderNotes')} <span className="text-neutral-400 font-normal normal-case">({t('optional')})</span>
                      </label>
                      <textarea
                        id="orderNotes"
                        name="orderNotes"
                        rows={4}
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder={t('orderNotesPlaceholder')}
                        className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide resize-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="giftMessage" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600 mb-4">
                        {t('giftMessage')} <span className="text-neutral-400 font-normal normal-case">({t('optional')})</span>
                      </label>
                      <textarea
                        id="giftMessage"
                        name="giftMessage"
                        rows={4}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder={t('giftMessagePlaceholder')}
                        className="block w-full px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="bg-white border border-neutral-200/30 shadow-sm w-full">
                  <div className="px-10 py-8 border-b border-neutral-200/30">
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-neutral-900">
                      Payment Method
                    </h2>
                  </div>
                  <div className="p-10">
                    <div className="space-y-4">
                      {/* Stripe Payment Option */}
                      <div
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'stripe' }))}
                        className={`p-6 border cursor-pointer transition-all duration-200 ${
                          formData.paymentMethod === 'stripe'
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200/40 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="stripe"
                              checked={formData.paymentMethod === 'stripe'}
                              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'stripe' | 'paypal' }))}
                              className="h-4 w-4 text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                            />
                            <div>
                              <p className="text-sm font-light text-neutral-900 tracking-wide">{t('creditDebitCard')}</p>
                              <p className="text-xs text-neutral-500 font-light mt-1 tracking-wide">{t('securePaymentViaStripe')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            {/* Visa Logo - Official */}
                            <div className="w-14 h-9 flex items-center justify-center bg-white rounded border border-neutral-200/30 p-1">
                              <img
                                src="/visa-logo-official.png"
                                alt="Visa"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {/* Mastercard Logo - Official */}
                            <div className="w-14 h-9 flex items-center justify-center bg-white rounded border border-neutral-200/30 p-1">
                              <img
                                src="/mastercard-logo-official.svg"
                                alt="Mastercard"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PayPal Payment Option */}
                      <div
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'paypal' }))}
                        className={`p-6 border cursor-pointer transition-all duration-200 ${
                          formData.paymentMethod === 'paypal'
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200/40 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="paypal"
                              checked={formData.paymentMethod === 'paypal'}
                              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'stripe' | 'paypal' }))}
                              className="h-4 w-4 text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                            />
                            <div>
                              <p className="text-sm font-light text-neutral-900 tracking-wide">PayPal</p>
                              <p className="text-xs text-neutral-500 font-light mt-1 tracking-wide">Pay with your PayPal account</p>
                            </div>
                          </div>
                          <div className="w-20 h-8 flex items-center justify-center bg-white rounded border border-neutral-200/30 p-1">
                            {/* PayPal Logo - Official */}
                            <img
                              src="/paypal-logo-official.jpg"
                              alt="PayPal Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    </div>


                    {/* Navigation Buttons */}
                    <div className="mt-10 pt-8 border-t border-neutral-200/30 flex gap-4">
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="flex-1 py-5 px-6 border border-neutral-200/40 text-sm font-light uppercase tracking-[0.15em] text-neutral-900 bg-white hover:bg-neutral-50 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('back')}
                      </button>
                      {formData.paymentMethod && (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="flex-1 py-5 px-6 border border-transparent text-sm font-light uppercase tracking-[0.15em] text-white bg-neutral-900 hover:bg-neutral-800 transition-all duration-200"
                        >
                          {t('reviewOrder')}
                          <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="bg-white border border-neutral-200/30 shadow-sm w-full">
                  <div className="px-10 py-8 border-b border-neutral-200/30">
                    <h2 className="text-xs font-light uppercase tracking-[0.2em] text-neutral-900">
                      {t('reviewYourOrder')}
                    </h2>
                  </div>
                  <div className="p-10 space-y-10">
                    {/* Shipping Address Review */}
                    <div>
                      <h3 className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-500 mb-5">{t('shippingAddress')}</h3>
                      <div className="bg-neutral-50 border border-neutral-200/30 p-6">
                        <p className="font-light text-neutral-900 text-sm tracking-wide">{formData.shippingName}</p>
                        <p className="font-light text-neutral-900 text-sm tracking-wide mt-1">{formData.shippingAddressLine1}</p>
                        {formData.shippingAddressLine2 && (
                          <p className="font-light text-neutral-900 text-sm tracking-wide">{formData.shippingAddressLine2}</p>
                        )}
                        <p className="font-light text-neutral-900 text-sm tracking-wide mt-1">
                          {formData.shippingPostalCode} {formData.shippingCity}
                        </p>
                        <p className="font-light text-neutral-900 text-sm tracking-wide">
                          {COUNTRIES.find(c => c.code === formData.shippingCountry)?.name || formData.shippingCountry}
                        </p>
                        {formData.shippingPhone && (
                          <p className="font-light text-neutral-900 text-sm tracking-wide mt-1">{formData.shippingPhone}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="mt-4 text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-light tracking-wide"
                      >
                        {t('editAddress')}
                      </button>
                    </div>

                    {/* Payment Method Review */}
                    <div>
                      <h3 className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-500 mb-5">{t('paymentMethod')}</h3>
                      <div className="bg-neutral-50 border border-neutral-200/30 p-6">
                        <p className="font-light text-neutral-900 text-sm tracking-wide capitalize">
                          {formData.paymentMethod === 'stripe' ? t('creditDebitCard') : 'PayPal'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="mt-4 text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-light tracking-wide"
                      >
                        {t('changePaymentMethod')}
                      </button>
                    </div>

                    {/* Order Notes & Gift Message */}
                    {(orderNotes || giftMessage) && (
                      <div>
                        <h3 className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-500 mb-5">{t('additionalInformation')}</h3>
                        <div className="bg-neutral-50 border border-neutral-200/30 p-6 space-y-5">
                          {orderNotes && (
                            <div>
                              <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('orderNotes')}</p>
                              <p className="text-sm font-light text-neutral-900 tracking-wide">{orderNotes}</p>
                            </div>
                          )}
                          {giftMessage && (
                            <div>
                              <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('giftMessage')}</p>
                              <p className="text-sm font-light text-neutral-900 tracking-wide">{giftMessage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Forms */}
                    {formData.paymentMethod === 'stripe' && stripeClientSecret && (
                      <div className="pt-6 border-t border-neutral-200/50">
                        <Elements
                          stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')}
                          options={{
                            clientSecret: stripeClientSecret,
                            appearance: {
                              theme: 'stripe',
                              variables: {
                                colorPrimary: '#000000',
                                colorBackground: '#ffffff',
                                colorText: '#171717',
                                colorDanger: '#ef4444',
                                fontFamily: 'system-ui, sans-serif',
                                spacingUnit: '4px',
                                borderRadius: '0px',
                              },
                            },
                          } as StripeElementsOptions}
                        >
                          <StripePaymentWrapper
                            clientSecret={stripeClientSecret}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            disabled={paymentProcessing}
                          />
                        </Elements>
                      </div>
                    )}

                    {formData.paymentMethod === 'paypal' && paypalOrderId && (
                      <div className="pt-6 border-t border-neutral-200/50">
                        <PayPalScriptProvider
                          options={{
                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                            currency: 'SEK',
                            intent: 'capture',
                          }}
                        >
                          <PayPalPaymentWrapper
                            orderId={paypalOrderId}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            disabled={paymentProcessing}
                            total={subtotal + (shippingCost || 0)}
                          />
                        </PayPalScriptProvider>
                      </div>
                    )}

                    {formData.paymentMethod && !stripeClientSecret && !paypalOrderId && shippingCost !== null && (
                      <div className="pt-6 border-t border-neutral-200/50">
                        <p className="text-sm text-neutral-500 text-center font-light">
                          {t('initializingPayment')}
                        </p>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="pt-8 border-t border-neutral-200/30 flex gap-4">
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="flex-1 py-5 px-6 border border-neutral-200/40 text-sm font-light uppercase tracking-[0.15em] text-neutral-900 bg-white hover:bg-neutral-50 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('back')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
            <div className="mt-8 lg:mt-0 flex-1 min-w-0">
              <div className="bg-white border border-neutral-200/30 shadow-sm lg:sticky lg:top-8">
                <div className="px-10 py-8 border-b border-neutral-200/30">
                  <h2 className="text-xs font-light uppercase tracking-[0.2em] text-neutral-900">
                    {t('orderSummary')}
                  </h2>
                </div>
                <div className="p-10">

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
                    const productImage = item.product?.images?.[0]?.url;

                    return (
                      <div key={item.id} className="flex gap-5 mb-6 last:mb-0 pb-6 last:pb-0 border-b border-neutral-200/30 last:border-0">
                        {productImage && (
                          <div className="w-20 h-20 overflow-hidden bg-neutral-50 flex-shrink-0">
                            <img
                              src={productImage}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-light text-neutral-900 text-sm tracking-wide">{name}</p>
                          {variantName && (
                            <p className="text-neutral-500 text-xs mt-1.5 font-light tracking-wide">{variantName}</p>
                          )}
                          <p className="text-neutral-500 text-xs mt-1.5 font-light tracking-wide">{t('quantity')}: {item.quantity}</p>
                          <p className="text-neutral-900 font-light text-sm mt-3 tracking-wide">
                            {formatPrice(price * item.quantity, 'SEK')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                  {/* Discount Code */}
                  {currentStep === 1 && (
                    <div className="border-b border-neutral-200/30 pb-8 mb-8">
                      {!appliedDiscount ? (
                        <div className="space-y-4">
                          <label htmlFor="discountCode" className="block text-[10px] font-light uppercase tracking-[0.2em] text-neutral-600">
                            {t('discountCode')}
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              id="discountCode"
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                              placeholder={t('enterCode')}
                              className="flex-1 px-6 py-4 border border-neutral-200/40 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm font-light tracking-wide"
                            />
                            <button
                              type="button"
                              onClick={handleApplyDiscount}
                              disabled={validatingDiscount || !discountCode.trim()}
                              className="px-6 py-4 border border-neutral-200/40 text-sm font-light uppercase tracking-[0.15em] text-neutral-900 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              {validatingDiscount ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : t('apply')}
                            </button>
                          </div>
                          {discountError && (
                            <p className="text-xs text-red-600 flex items-center gap-1 font-light tracking-wide">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {discountError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-5 bg-green-50 border border-green-200/40">
                          <div>
                            <p className="text-sm font-light text-green-800 tracking-wide">
                              {t('discountApplied')}: {appliedDiscount.code}
                            </p>
                            <p className="text-xs text-green-600 mt-1.5 font-light tracking-wide">
                              -{formatPrice(appliedDiscount.amount, 'SEK')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveDiscount}
                            className="text-xs text-green-600 hover:text-green-800 font-light transition-colors tracking-wide"
                          >
                            {t('remove')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Totals */}
                  <dl className="space-y-5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-600 font-light tracking-wide">{t('subtotalInclVat')}</dt>
                      <dd className="text-neutral-900 font-light tracking-wide">{formatPrice(subtotal, 'SEK')}</dd>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-green-600">
                        <dt className="font-light tracking-wide">{t('discount')} ({appliedDiscount.code})</dt>
                        <dd className="font-light tracking-wide">-{formatPrice(appliedDiscount.amount, 'SEK')}</dd>
                      </div>
                    )}
                    {shippingCost !== null ? (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600 font-light tracking-wide">{tCart('shipping')}</dt>
                        <dd className="text-neutral-900 font-light tracking-wide">
                          {shippingCost === 0 ? (
                            <span className="text-green-600">{t('free')}</span>
                          ) : (
                            formatPrice(shippingCost, 'SEK')
                          )}
                        </dd>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600 font-light tracking-wide">{tCart('shipping')}</dt>
                        <dd className="text-neutral-500 text-xs italic font-light tracking-wide">
                          {formData.shippingName && formData.shippingAddressLine1 && formData.shippingCity && formData.shippingPostalCode && formData.shippingCountry
                            ? t('calculating')
                            : t('enterAddressToCalculate')
                          }
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-200/30 font-light tracking-wide">
                      <dt>{t('vatIncludedInSubtotal')}</dt>
                      <dd>{formatPrice(tax, 'SEK')}</dd>
                    </div>
                    <div className="flex justify-between text-base font-light border-t border-neutral-200/30 pt-5 mt-5">
                      <dt className="text-neutral-900 tracking-wide">{tCart('total')}</dt>
                      <dd className="text-neutral-900 tracking-wide">
                        {shippingCost !== null ? (
                          formatPrice(total, 'SEK')
                        ) : (
                          <span className="text-neutral-500 text-sm font-light italic">
                            {formatPrice(subtotal - discountAmount, 'SEK')} + {t('shipping')}
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {/* Trust Badges */}
                  <div className="mt-10 pt-10 border-t border-neutral-200/30">
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className="text-xs font-light text-neutral-700 tracking-wide">{t('securePayment')}</p>
                        <p className="text-[10px] text-neutral-500 mt-1 font-light tracking-wide">{t('sslEncrypted')}</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <p className="text-xs font-light text-neutral-700 tracking-wide">{t('moneyBack')}</p>
                        <p className="text-[10px] text-neutral-500 mt-1 font-light tracking-wide">{t('thirtyDayGuarantee')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Continue to Payment Button - Bottom of Order Summary */}
                  {currentStep === 1 && (
                    <div className="mt-10 pt-10 border-t border-neutral-200/30">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!isShippingComplete()}
                        className="w-full py-5 px-6 border border-transparent text-sm font-light uppercase tracking-[0.15em] text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {t('continueToPayment')}
                        <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </section>
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

