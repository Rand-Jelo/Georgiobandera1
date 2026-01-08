'use client';

import { useTranslations } from 'next-intl';

export default function ShippingPage() {
  const t = useTranslations('shipping');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Matching Homepage/Contact */}
      <section className="relative bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white py-16 lg:py-20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="relative max-w-[1600px] mx-auto px-6">
          <div className="max-w-4xl">
            <div className="inline-block mb-4">
              <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                Legal Information
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
            </div>
            <h1 className="text-4xl font-extralight tracking-[0.02em] leading-[1.1] mb-2 sm:text-5xl lg:text-6xl">
              {t('title') || 'Shipping Policy'}
            </h1>
            <p className="text-sm font-light text-neutral-300 tracking-wide mt-2">
              {t('subtitle') || 'Information about our shipping methods, delivery times, and shipping costs.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Last Updated */}
            <div className="pb-6 border-b border-neutral-200">
              <p className="text-xs font-light text-neutral-500 uppercase tracking-wider">
                {t('lastUpdated') || 'Last Updated'}: {t('lastUpdatedDate') || 'January 2025'}
              </p>
            </div>

            {/* Section 1: Shipping Methods */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section1.title') || '1. Shipping Methods'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section1.content1') || 'We offer various shipping methods to accommodate your needs:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section1.item1') || 'Standard Shipping: Regular delivery service with tracking'}</li>
                  <li>{t('section1.item2') || 'International Shipping: Available to select countries worldwide'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section1.content2') || 'Shipping options and costs are displayed during checkout. You can select your preferred shipping method before completing your order.'}
                </p>
              </div>
            </section>

            {/* Section 2: Delivery Times */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section2.title') || '2. Delivery Times'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section2.content1') || 'Estimated delivery times vary based on your location and the shipping method selected:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section2.item1') || 'Sweden: 2-5 business days'}</li>
                  <li>{t('section2.item2') || 'Nordic Countries: 3-7 business days'}</li>
                  <li>{t('section2.item3') || 'Europe: 5-10 business days'}</li>
                  <li>{t('section2.item4') || 'International: 7-21 business days depending on destination'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section2.content2') || 'Please note that delivery times are estimates and not guaranteed. Delays may occur due to customs processing, weather conditions, or other factors beyond our control.'}
                </p>
                <p className="text-sm font-light">
                  {t('section2.content3') || 'Processing time: Orders are typically processed within 1-2 business days after payment confirmation, excluding weekends and holidays.'}
                </p>
              </div>
            </section>

            {/* Section 3: Shipping Costs */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section3.title') || '3. Shipping Costs'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section3.content1') || 'Shipping costs are calculated based on:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section3.item1') || 'Destination country and region'}</li>
                  <li>{t('section3.item2') || 'Package weight and dimensions'}</li>
                  <li>{t('section3.item3') || 'Selected shipping method'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section3.content2') || 'Free shipping may be available for orders over a certain amount. Check our website for current promotions and free shipping thresholds.'}
                </p>
                <p className="text-sm font-light">
                  {t('section3.content3') || 'All shipping costs are displayed clearly during checkout before you complete your purchase. You will not be charged any hidden fees.'}
                </p>
              </div>
            </section>

            {/* Section 4: Order Tracking */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section4.title') || '4. Order Tracking'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section4.content1') || 'Once your order has been shipped, you will receive a shipping confirmation email containing:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section4.item1') || 'Tracking number for your shipment'}</li>
                  <li>{t('section4.item2') || 'Link to track your package online'}</li>
                  <li>{t('section4.item3') || 'Estimated delivery date'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section4.content2') || 'You can track your order status in your account dashboard or by using the tracking number provided. Tracking information is typically available within 24-48 hours after shipment.'}
                </p>
              </div>
            </section>

            {/* Section 5: International Shipping */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section5.title') || '5. International Shipping'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section5.content1') || 'We ship to many countries worldwide. When ordering internationally, please be aware that:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section5.item1') || 'Customs duties, taxes, and fees may apply and are the responsibility of the recipient'}</li>
                  <li>{t('section5.item2') || 'Delivery times may be longer due to customs processing'}</li>
                  <li>{t('section5.item3') || 'Some products may be restricted or prohibited in certain countries'}</li>
                  <li>{t('section5.item4') || 'You may need to provide additional documentation for customs clearance'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section5.content2') || 'We are not responsible for any customs fees, import duties, or taxes imposed by your country. These charges are separate from the shipping cost and must be paid by the recipient upon delivery.'}
                </p>
              </div>
            </section>

            {/* Section 6: Lost or Damaged Packages */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section6.title') || '6. Lost or Damaged Packages'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section6.content1') || 'If your package is lost or damaged during transit:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section6.item1') || 'Contact us immediately within 7 days of the estimated delivery date'}</li>
                  <li>{t('section6.item2') || 'Provide your order number and tracking information'}</li>
                  <li>{t('section6.item3') || 'For damaged items, include photos of the damaged package and contents'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section6.content2') || 'We will investigate the issue and work with the shipping carrier to resolve it. If your package is confirmed lost or damaged, we will replace the items or provide a full refund at our discretion.'}
                </p>
                <p className="text-sm font-light">
                  {t('section6.content3') || 'Please note that we are not responsible for packages that are lost or damaged after delivery confirmation, or if an incorrect shipping address was provided.'}
                </p>
              </div>
            </section>

            {/* Section 7: Shipping Address */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section7.title') || '7. Shipping Address'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section7.content1') || 'It is your responsibility to provide a correct and complete shipping address. Please double-check your address before completing your order.'}
                </p>
                <p className="text-sm font-light">
                  {t('section7.content2') || 'If you provide an incorrect address and the package is returned to us, you will be responsible for the return shipping costs and any additional shipping fees to resend the package to the correct address.'}
                </p>
                <p className="text-sm font-light">
                  {t('section7.content3') || 'For security reasons, we cannot change the shipping address after an order has been placed. If you need to update your address, please contact us immediately, and we will do our best to accommodate your request if the order has not yet been shipped.'}
                </p>
              </div>
            </section>

            {/* Section 8: Contact Us */}
            <section className="space-y-4 pt-6 border-t border-neutral-200">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section8.title') || '8. Contact Us'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section8.content1') || 'If you have any questions about our shipping policy or need assistance with your order, please contact us:'}
                </p>
                <div className="text-sm font-light space-y-1 pl-4">
                  <p>{t('section8.email') || 'Email: info@georgiobandera.se'}</p>
                  <p>{t('section8.website') || 'Website: www.georgiobandera.se'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

