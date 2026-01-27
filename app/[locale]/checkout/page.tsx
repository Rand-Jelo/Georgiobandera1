'use client';

import * as React from 'react';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { COUNTRIES } from '@/lib/constants/countries';
import { validateAddressFormat, validatePostalCode, formatPostalCode } from '@/lib/utils/address-validation';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePayment from '@/components/payment/StripePayment';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import visaLogo from '@/assets/images/visa-official.svg';
import mastercardLogo from '@/assets/images/mastercard-official.svg';
import klarnaLogo from '@/assets/images/klarna-official.svg';

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

interface User {
  email: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
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
    paymentMethod: 'stripe' as 'stripe' | 'paypal' | '',
  });

  const [phoneCountryCode, setPhoneCountryCode] = useState('+46'); // Default to Sweden

  const [shippingCost, setShippingCost] = useState<number | null>(null); // null means not calculated yet
  const [calculatingShipping, setCalculatingShipping] = useState(false);
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Missing state variables
  const [user, setUser] = useState<User | null>(null); // Placeholder for user state
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showSaveAddress, setShowSaveAddress] = useState(false);

  // Order notes and gift message
  const [orderNotes, setOrderNotes] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  // Single-page checkout with collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    shipping: false,
    payment: false,
    review: false,
  });

  // Address validation
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Success/error notifications
  // Guest checkout
  const [createAccount, setCreateAccount] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // ... (rest of state)
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
      if (response.ok) {
        const data = await response.json() as { user: User };
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
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
      setError(t('failedToLoadCheckout'));
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
      setCalculatingShipping(false);
      return;
    }

    setCalculatingShipping(true);
    try {
      const region = shippingRegions.find(r => r.id === formData.shippingRegionId);
      if (!region) {
        setShippingCost(null);
        setCalculatingShipping(false);
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
    } finally {
      setCalculatingShipping(false);
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

  // Initialize payment when method is selected and shipping is complete
  // Payment initializes as soon as both conditions are met (no need to wait for review step)
  useEffect(() => {
    if (shippingCost === null || total <= 0) {
      setStripeClientSecret(null);
      return;
    }

    // Initialize payment as soon as shipping is complete and payment method is selected
    if (!isShippingComplete()) {
      setStripeClientSecret(null);
      return;
    }

    const initializePayment = async () => {
      try {
        // Always usage stripe logic now
        const response = await fetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingRegionId: formData.shippingRegionId,
            discountCode: appliedDiscount?.code || null,
            email: guestEmail || user?.email || undefined, // Send guest email if available
          }),
        });

        const data = await response.json() as {
          clientSecret?: string;
          paymentIntentId?: string;
          error?: string;
          details?: string;
        };

        if (data.error) {
          const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || t('failedToInitPayment'));
          setError(errorMsg);
          console.error('Stripe payment intent error:', data);
          return;
        }

        if (data.clientSecret) {
          setStripeClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Error initializing payment:', err);
        setError(t('failedToInitPayment'));
      }
    };

    initializePayment();
  }, [
    // Depend on shipping completion and cost/total changes
    formData.shippingRegionId,
    shippingCost,
    total,
    guestEmail,
    user?.email
    // removed formData.paymentMethod dependence
  ]);

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
          const saveResponse = await fetch('/api/addresses', {
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

          if (saveResponse.ok) {
            setNotification({ type: 'success', message: t('addressSavedSuccess') });
            setTimeout(() => setNotification(null), 3000);
          }
        } catch (err) {
          console.error('Error saving address:', err);
          // Continue with order creation even if address save fails
        }
      }

      // usage confirm-payment API to verify payment and create order
      const response = await fetch('/api/checkout/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentId,
        }),
      });

      const data = await response.json() as {
        success?: boolean;
        orderNumber?: string;
        error?: string;
        details?: string;
      };

      if (data.error || !data.success) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || t('failedToConfirmPayment'));
        setError(errorMsg);
        console.error('Confirm payment error:', data);
        setPaymentProcessing(false);
        return;
      }

      // Success! Clear local cart state if needed (API already clears DB cart)
      setCartItems([]);

      // Redirect to success page
      router.push(`/orders/success?orderNumber=${data.orderNumber}`);

    } catch (err) {
      console.error('Payment success handler error:', err);
      setError(t('unexpectedError'));
      setPaymentProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setPaymentProcessing(false);
    setNotification({ type: 'error', message: errorMessage });
    // Scroll to error
    setTimeout(() => {
      const errorElement = document.querySelector('[data-error-section]');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handlePlaceOrder = async () => {
    if (!formData.paymentMethod) {
      const errorMsg = t('pleaseSelectPaymentMethod');
      setError(errorMsg);
      setNotification({ type: 'error', message: errorMsg });
      setExpandedSections(prev => ({ ...prev, payment: true }));
      setTimeout(() => {
        document.querySelector('[data-section="payment"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    if (!isShippingComplete()) {
      const errorMsg = t('pleaseCompleteShippingInfo');
      setError(errorMsg);
      setNotification({ type: 'error', message: errorMsg });
      setExpandedSections(prev => ({ ...prev, shipping: true }));
      setTimeout(() => {
        document.querySelector('[data-section="shipping"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    // If payment method is selected, the payment forms should handle the order placement
    // This function is mainly for validation and triggering payment
    setProcessing(true);
    setError('');
    setNotification(null);

    // The actual order placement happens in handlePaymentSuccess
    // which is called by the payment components after successful payment
  };

  // Auto-hide notification after 5 seconds and scroll to it
  useEffect(() => {
    if (notification) {
      // Scroll to notification if it's an error
      if (notification.type === 'error') {
        setTimeout(() => {
          const errorElement = document.querySelector('[data-error-section]');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }

      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Scroll to first error field when validation errors appear
  useEffect(() => {
    const firstErrorKey = Object.keys(addressErrors)[0];
    if (firstErrorKey) {
      const errorField = document.getElementById(firstErrorKey === 'guestEmail' ? 'guestEmail' : `shipping${firstErrorKey.charAt(0).toUpperCase() + firstErrorKey.slice(1)}`);
      if (errorField) {
        setTimeout(() => {
          errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorField.focus();
        }, 100);
      }
    }
  }, [addressErrors]);

  // Auto-detect shipping region when country changes
  useEffect(() => {
    if (formData.shippingCountry) {
      detectShippingRegion(formData.shippingCountry);
    }

  }, [formData.shippingCountry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time validation for all fields
    const newErrors: Record<string, string> = { ...addressErrors };

    // Validate required fields
    if (name === 'shippingName') {
      if (value.trim().length < 2) {
        newErrors.shippingName = t('validationNameMinLength');
      } else {
        delete newErrors.shippingName;
      }
    }

    if (name === 'shippingAddressLine1') {
      if (value.trim().length < 5) {
        newErrors.shippingAddressLine1 = t('validationAddressMinLength');
      } else {
        delete newErrors.shippingAddressLine1;
      }
    }

    if (name === 'shippingCity') {
      if (value.trim().length < 2) {
        newErrors.shippingCity = t('validationCityMinLength');
      } else {
        delete newErrors.shippingCity;
      }
    }

    // Validate phone number (allow only digits, spaces, dashes, parentheses, and plus sign)
    if (name === 'shippingPhone') {
      // Remove everything except digits, spaces, dashes, parentheses, and plus sign
      const cleanedValue = value.replace(/[^\d\s\-\(\)\+]/g, '');

      // Update the value if it changed (to enforce restriction)
      if (cleanedValue !== value) {
        setFormData(prev => ({ ...prev, [name]: cleanedValue }));
        return;
      }

      // Check minimum length for phone (at least 6 digits)
      const digitsOnly = cleanedValue.replace(/\D/g, '');
      if (cleanedValue && digitsOnly.length < 6) {
        newErrors.shippingPhone = t('validationPhoneMinLength');
      } else if (cleanedValue && digitsOnly.length > 15) {
        newErrors.shippingPhone = t('validationPhoneMaxLength');
      } else {
        delete newErrors.shippingPhone;
      }
    }

    // Validate postal code when it changes (Numeric only, max 5 digits)
    if (name === 'shippingPostalCode') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '').slice(0, 5);

      // Update the value if it changed (to enforce restriction)
      if (numericValue !== value) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        return; // Stop here, the state update will trigger another render/change
      }

      if (formData.shippingCountry) {
        const validation = validatePostalCode(numericValue, formData.shippingCountry, t);
        if (!validation.valid) {
          newErrors.shippingPostalCode = validation.errors[0] || 'Invalid postal code';
        } else {
          delete newErrors.shippingPostalCode;
        }
      }
    }

    // Handle guest email separately
    if (name === 'guestEmail') {
      setGuestEmail(value);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        newErrors.guestEmail = t('validationEmailInvalid');
      } else {
        delete newErrors.guestEmail;
      }
      setAddressErrors(newErrors);
      return;
    }

    // Clear postal code error when country changes
    if (name === 'shippingCountry') {
      delete newErrors.shippingPostalCode;
      // When country changes, auto-detect shipping region
      detectShippingRegion(value);
    }

    setAddressErrors(newErrors);
  };

  // Sync phone country code when shipping country changes
  useEffect(() => {
    if (formData.shippingCountry) {
      const country = COUNTRIES.find(c => c.code === formData.shippingCountry);
      if (country && country.dial_code) {
        setPhoneCountryCode(country.dial_code);
      }
    }
  }, [formData.shippingCountry]);

  const handleApplyDiscount = async (codeToApply?: string) => {
    const targetCode = (codeToApply || discountCode).trim();
    if (!targetCode) {
      setDiscountError(t('pleaseEnterDiscountCode'));
      return;
    }

    if (codeToApply) {
      setDiscountCode(codeToApply);
    }

    setValidatingDiscount(true);
    setDiscountError('');

    try {
      const response = await fetch('/api/checkout/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: targetCode,
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
        let errorKey = 'invalidDiscountCode';
        const apiError = data.error || '';

        if (apiError.includes('Discount code not found')) errorKey = 'discountNotFound';
        else if (apiError.includes('Discount code is inactive')) errorKey = 'discountInactive';
        else if (apiError.includes('Discount code is not yet valid')) errorKey = 'discountNotYetValid';
        else if (apiError.includes('Discount code has expired')) errorKey = 'discountExpired';
        else if (apiError.includes('usage limit')) errorKey = 'discountUsageLimit';
        else if (apiError.includes('already used')) errorKey = 'discountUserUsageLimit';
        else if (apiError.includes('Minimum purchase')) {
          const match = apiError.match(/\d+/);
          const amount = match ? match[0] : '';
          setDiscountError(t('discountMinPurchase', { amount }));
          setAppliedDiscount(null);
          return;
        }

        setDiscountError(t(errorKey));
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

  // Navigation between sections is now handled manually via button clicks only
  // Auto-expand was removed because it caused premature section switching while typing

  const handleShippingSubmit = () => {
    setNotification(null);
    setError('');

    // Trigger validation for all required fields to show red borders
    const newErrors: Record<string, string> = { ...addressErrors };
    let hasMissingFields = false;

    if (!formData.shippingName) { newErrors.shippingName = t('validationNameMinLength'); hasMissingFields = true; }
    if (!formData.shippingAddressLine1) { newErrors.shippingAddressLine1 = t('validationAddressMinLength'); hasMissingFields = true; }
    if (!formData.shippingCity) { newErrors.shippingCity = t('validationCityMinLength'); hasMissingFields = true; }
    if (!formData.shippingPhone) { newErrors.shippingPhone = t('validationPhoneMinLength'); hasMissingFields = true; }
    if (!formData.shippingPostalCode) { newErrors.shippingPostalCode = t('invalidPostalCode'); hasMissingFields = true; }
    if (!formData.shippingCountry) { newErrors.shippingCountry = t('selectCountry'); hasMissingFields = true; }
    if (!isLoggedIn && !guestEmail) { newErrors.guestEmail = t('validationEmailInvalid'); hasMissingFields = true; }

    if (hasMissingFields) {
      setAddressErrors(newErrors);
      const msg = t('fillAllFields');
      setError(msg);
      setNotification({ type: 'error', message: msg });
      return;
    }

    // Check for existing validation errors (like invalid email format)
    if (Object.keys(addressErrors).length > 0) {
      const msg = t('pleaseCompleteShippingInfo');
      setError(msg);
      setNotification({ type: 'error', message: msg });
      return;
    }

    toggleSection('shipping'); // Or logic to move to shipping method
  };

  const toggleSection = (section: 'shipping' | 'payment' | 'review') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleEditContact = () => {
    // Logic to go back to contact editing (Step 1)
    setExpandedSections({
      shipping: false,
      payment: false,
      review: false
    });
  };

  const handleEditShipping = () => {
    setExpandedSections({
      shipping: true,
      payment: false,
      review: false
    });
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

  const sections = [
    { id: 'shipping' as const, label: t('shipping'), icon: 'location' },
    { id: 'payment' as const, label: t('payment'), icon: 'payment' },
    { id: 'review' as const, label: t('review'), icon: 'check' },
  ];



  // Determine current step for breadcrumbs based on expanded sections
  const getCurrentStep = () => {
    if (expandedSections.payment) return 'payment';
    if (expandedSections.shipping) return 'shipping';
    return 'information';
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white font-sans text-neutral-900">

      {/* Mobile Summary Toggle */}
      <div className="lg:hidden border-b border-gray-200 bg-gray-50">
        <CheckoutSummary
          cartItems={cartItems}
          subtotal={subtotal}
          shippingCost={shippingCost}
          discountAmount={appliedDiscount?.amount || 0}
          total={total}
          discountCode={appliedDiscount?.code || ''}
          isApplyingDiscount={validatingDiscount}
          onApplyDiscount={handleApplyDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          currency="SEK"
          locale={locale}
          discountError={discountError}
        />
      </div>

      {/* Main Content (Left) */}
      <div className="w-full lg:w-[58%] flex flex-col border-r border-gray-200">
        <div className="w-full max-w-[600px] mx-auto px-4 sm:px-6 pt-8 pb-12 lg:pt-14 lg:pb-24 flex-1">

          {/* Desktop Logo */}
          <div className="hidden lg:block mb-8">
            <Link href="/" className="text-2xl font-light tracking-widest text-neutral-900">
              GEORGIO BANDERA
            </Link>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden mb-6 text-center">
            <Link href="/" className="text-xl font-light tracking-widest text-neutral-900">
              GEORGIO BANDERA
            </Link>
          </div>

          <CheckoutSteps currentStep={getCurrentStep()} />

          {/* Global Notification/Error Banner */}
          {(notification || error) && (
            <div data-error-section className="mt-6">
              <div className={`rounded-xl p-4 flex items-start gap-3 transition-all duration-300 border ${notification?.type === 'success'
                ? 'bg-green-50 border-green-100 text-green-800'
                : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                <div className="mt-0.5">
                  {notification?.type === 'success' ? (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 text-sm font-medium">
                  {notification?.message || error}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    setError('');
                  }}
                  className={`flex-shrink-0 ml-auto -mr-1 rounded-md p-1 transition-colors ${notification?.type === 'success'
                    ? 'hover:bg-green-100/50'
                    : 'hover:bg-red-100/50'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-8" onSubmit={(e) => e.preventDefault()}>

            {/* Step 1: Contact & Address */}
            <div className={!expandedSections.shipping && !expandedSections.payment ? 'block animate-fade-in' : 'hidden'}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-medium">{t('contactInformation')}</h2>
                {!isLoggedIn && (
                  <Link href="/login" className="text-sm text-blue-600 hover:underline">
                    {t('auth.login')}
                  </Link>
                )}
              </div>
              {isLoggedIn && savedAddresses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{t('useSavedAddress')}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {savedAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(address)}
                        className={`text-left p-4 border rounded-lg transition-all ${selectedAddressId === address.id
                            ? 'border-black bg-gray-50 ring-1 ring-black'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {address.first_name} {address.last_name}
                              {address.is_default === 1 && (
                                <span className="ml-2 text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                  Default
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {address.postal_code} {address.city}, {address.country}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddressId === address.id ? 'border-black bg-black' : 'border-gray-300'
                            }`}>
                            {selectedAddressId === address.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setFormData({
                          ...formData,
                          shippingName: '',
                          shippingAddressLine1: '',
                          shippingAddressLine2: '',
                          shippingCity: '',
                          shippingPostalCode: '',
                          shippingPhone: '',
                        });
                      }}
                      className={`text-left p-3 border rounded-lg text-xs font-medium transition-all ${!selectedAddressId
                          ? 'border-black bg-gray-50 ring-1 ring-black'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      + {t('useDifferentAddress')}
                    </button>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mb-6 italic">{t('requiredFields')}</p>

              {/* Reuse Existing Contact Inputs Structure but with new styling */}
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('emailAddress')} *</label>
                  <input
                    type="email"
                    required
                    value={isLoggedIn ? (user?.email || '') : guestEmail}
                    onChange={handleChange}
                    name={isLoggedIn ? 'email' : 'guestEmail'}
                    id={isLoggedIn ? 'email' : 'guestEmail'}
                    className={`block w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm ${addressErrors.guestEmail ? 'border-red-500' : ''}`}
                    placeholder={t('emailPlaceholder')}
                    disabled={!!isLoggedIn}
                  />
                  {!isLoggedIn && addressErrors.guestEmail && <p className="text-red-500 text-xs mt-1">{addressErrors.guestEmail}</p>}
                </div>

                <h2 className="text-xl font-medium pt-6 pb-2">{t('shippingAddress')}</h2>

                {/* Address Fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <select
                      id="shippingCountry"
                      name="shippingCountry"
                      value={formData.shippingCountry}
                      onChange={handleChange}
                      className="block w-full h-12 pl-5 pr-12 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm appearance-none bg-[url('data:image/svg+xml,%3csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20fill=\'none\'%20viewBox=\'0%200%2024%2024\'%20stroke=\'%236B7280\'%20stroke-width=\'2\'%3e%3cpath%20stroke-linecap=\'round\'%20stroke-linejoin=\'round\'%20d=\'m19.5%208.25-7.5%207.5-7.5-7.5\'/%3e%3c/svg%3e')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[position:right_1.25rem_center]"
                    >
                      <option value="">{t('selectCountry')} *</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      name="shippingName"
                      placeholder={`${t('fullName')} *`}
                      value={formData.shippingName}
                      onChange={handleChange}
                      className={`block w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm ${addressErrors.shippingName ? 'border-red-500' : ''}`}
                    />
                    {addressErrors.shippingName && <p className="text-red-500 text-xs mt-1">{addressErrors.shippingName}</p>}
                  </div>
                  <div className="sm:col-span-1">
                    {/* Phone */}
                    <input
                      type="tel"
                      name="shippingPhone"
                      placeholder={`${t('phone')} *`}
                      value={formData.shippingPhone}
                      onChange={handleChange}
                      className={`block w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm ${addressErrors.shippingPhone ? 'border-red-500' : ''}`}
                    />
                    {addressErrors.shippingPhone && <p className="text-red-500 text-xs mt-1">{addressErrors.shippingPhone}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      name="shippingAddressLine1"
                      placeholder={`${t('addressLine1')} *`}
                      value={formData.shippingAddressLine1}
                      onChange={handleChange}
                      className={`block w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm ${addressErrors.shippingAddressLine1 ? 'border-red-500' : ''}`}
                    />
                    {addressErrors.shippingAddressLine1 && <p className="text-red-500 text-xs mt-1">{addressErrors.shippingAddressLine1}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      name="shippingAddressLine2"
                      placeholder={`${t('addressLine2')} (${t('optional')})`}
                      value={formData.shippingAddressLine2}
                      onChange={handleChange}
                      className="block w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      name="shippingPostalCode"
                      placeholder={`${t('postalCode')} *`}
                      value={formData.shippingPostalCode}
                      onChange={handleChange}
                      className={`block w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm ${addressErrors.shippingPostalCode ? 'border-red-500' : ''}`}
                    />
                    {addressErrors.shippingPostalCode && (
                      <p className="text-xs text-red-500 mt-1">{addressErrors.shippingPostalCode}</p>
                    )}
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      name="shippingCity"
                      placeholder={`${t('city')} *`}
                      value={formData.shippingCity}
                      onChange={handleChange}
                      className={`block w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm ${addressErrors.shippingCity ? 'border-red-500' : ''}`}
                    />
                    {addressErrors.shippingCity && <p className="text-red-500 text-xs mt-1">{addressErrors.shippingCity}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleShippingSubmit()}
                  className="px-8 py-4 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors w-full sm:w-auto shadow-lg"
                >
                  {t('continueToShipping') || 'Continue to Shipping'}
                </button>
              </div>
            </div>


            {/* Step 2: Shipping Method */}
            {expandedSections.shipping && !expandedSections.payment && (
              <div className="animate-fade-in space-y-8">
                {/* Review Block */}
                <div className="border border-gray-200 rounded-lg p-4 text-sm divide-y divide-gray-200 bg-white">
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500 w-24">{t('contact')}</span>
                    <span className="text-gray-900 flex-1 font-medium">{isLoggedIn ? user?.email : guestEmail}</span>
                    <button type="button" onClick={() => {
                      handleEditContact()
                    }} className="text-blue-600 hover:underline text-xs font-medium">{t('change')}</button>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500 w-24">{t('shipTo')}</span>
                    <span className="text-gray-900 flex-1 font-medium">{formData.shippingAddressLine1}, {formData.shippingCity}</span>
                    <button type="button" onClick={() => toggleSection('shipping')} className="text-blue-600 hover:underline text-xs font-medium">{t('change')}</button>
                  </div>
                </div>

                <h2 className="text-xl font-medium text-neutral-900">{t('shippingMethod')}</h2>

                <div className="space-y-4">
                  {loadingShipping ? (
                    <div className="p-4 text-center text-gray-500">{t('calculatingShipping')}</div>
                  ) : selectedRegion ? (
                    <div className="border border-gray-200 rounded-lg bg-white">
                      <div className="p-4 flex items-center justify-between bg-gray-50 ring-1 ring-black">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={true}
                            readOnly
                            className="h-4 w-4 text-black focus:ring-black border-gray-300"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-900">
                              {locale === 'sv' ? selectedRegion.name_sv : selectedRegion.name_en}
                            </span>
                            {selectedRegion.free_shipping_threshold && subtotal < selectedRegion.free_shipping_threshold && (
                              <p className="text-xs text-gray-500 mt-1">
                                {t('freeShippingOver', { amount: formatPrice(selectedRegion.free_shipping_threshold, 'SEK') })}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {(() => {
                            // Calculate display price - use shippingCost if available, otherwise calculate from region
                            const displayCost = shippingCost !== null
                              ? shippingCost
                              : (selectedRegion.free_shipping_threshold && subtotal >= selectedRegion.free_shipping_threshold)
                                ? 0
                                : selectedRegion.base_price;
                            return displayCost === 0 ? t('free') : formatPrice(displayCost, 'SEK');
                          })()}
                        </span>
                      </div>
                    </div>
                  ) : formData.shippingCountry ? (
                    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                      {t('enterAddressToCalculate')}
                    </div>
                  ) : (
                    <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {t('enterAddressToCalculate')}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleEditContact()}
                    className="text-blue-600 hover:underline text-sm flex items-center gap-2"
                  >
                    <span className="transform rotate-180">→</span> {t('backToInformation')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedRegion) {
                        setError(t('pleaseSelectShippingRegion'));
                        return;
                      }
                      toggleSection('payment');
                    }}
                    className="px-8 py-4 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors w-full sm:w-auto shadow-lg"
                  >
                    {t('continueToPayment')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {expandedSections.payment && (
              <div className="animate-fade-in space-y-8">
                {/* Review Block */}
                <div className="border border-gray-200 rounded-lg p-4 text-sm divide-y divide-gray-200 bg-white">
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500 w-24">{t('contact')}</span>
                    <span className="text-gray-900 flex-1 font-medium">{isLoggedIn ? user?.email : guestEmail}</span>
                    <button type="button" onClick={() => {
                      handleEditShipping();
                    }} className="text-blue-600 hover:underline text-xs font-medium">{t('change')}</button>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500 w-24">{t('shipTo')}</span>
                    <span className="text-gray-900 flex-1 font-medium">{formData.shippingAddressLine1}, {formData.shippingCity}</span>
                    <button type="button" onClick={() => handleEditShipping()} className="text-blue-600 hover:underline text-xs font-medium">{t('change')}</button>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500 w-24">{t('method')}</span>
                    <span className="text-gray-900 flex-1 font-medium">
                      {selectedRegion ? (locale === 'sv' ? selectedRegion.name_sv : selectedRegion.name_en) : '-'} · {shippingCost !== null ? (shippingCost === 0 ? t('free') : formatPrice(shippingCost, 'SEK')) : '-'}
                    </span>
                    <button type="button" onClick={() => toggleSection('payment')} className="text-blue-600 hover:underline text-xs font-medium">{t('change')}</button>
                  </div>
                </div>

                <h2 className="text-xl font-medium text-neutral-900">{t('payment')}</h2>
                <p className="text-sm text-gray-500">{t('securePaymentViaStripe')}</p>

                {/* Stripe Element */}
                <div className="border border-gray-200 rounded-lg p-0 overflow-hidden bg-white shadow-sm">
                  {stripeClientSecret ? (
                    <Elements
                      stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')}
                      options={{
                        clientSecret: stripeClientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#000000',
                            borderRadius: '8px',
                            fontFamily: 'system-ui, sans-serif',
                          },
                        },
                      } as StripeElementsOptions}
                    >
                      <div className="p-6">
                        <StripePayment
                          clientSecret={stripeClientSecret}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                          disabled={paymentProcessing}
                          shippingDetails={{
                            name: formData.shippingName,
                            address: {
                              line1: formData.shippingAddressLine1,
                              line2: formData.shippingAddressLine2,
                              city: formData.shippingCity,
                              postal_code: formData.shippingPostalCode,
                              country: formData.shippingCountry,
                            },
                            phone: formData.shippingPhone,
                          }}
                        />
                      </div>
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center p-12 text-gray-500">
                      {t('paymentInitializing')}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-start">
                  <button onClick={() => toggleSection('payment')} className="text-blue-600 hover:underline text-sm flex items-center gap-2">
                    <span className="transform rotate-180">→</span> {t('backToShipping')}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Footer Links */}
          <div className="mt-16 pt-6 border-t border-gray-200 flex gap-4 text-xs text-gray-500 flex-wrap">
            <Link href="/legal/returns" className="hover:underline">{t('refundPolicy')}</Link>
            <Link href="/legal/shipping" className="hover:underline">{t('shippingPolicyLink')}</Link>
            <Link href="/legal/privacy" className="hover:underline">{t('privacyPolicyLink')}</Link>
            <Link href="/legal/terms" className="hover:underline">{t('termsOfService')}</Link>
          </div>
        </div>
      </div>

      {/* Sidebar (Right) */}
      <div className="hidden lg:block w-full lg:w-[42%] bg-[#fafafa] relative">
        <div className="sticky top-0 h-screen overflow-y-auto p-12 pr-12 xl:pr-24 border-l border-gray-200">
          <CheckoutSummary
            cartItems={cartItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            discountAmount={appliedDiscount?.amount || 0}
            total={total}
            discountCode={appliedDiscount?.code || ''}
            isApplyingDiscount={validatingDiscount}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            currency="SEK"
            locale={locale}
            discountError={discountError}
          />
        </div>
      </div>

    </div>

  );
}
