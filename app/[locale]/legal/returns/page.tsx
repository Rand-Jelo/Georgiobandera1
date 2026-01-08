'use client';

import { useTranslations } from 'next-intl';

export default function ReturnsPage() {
  const t = useTranslations('returns');

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
              {t('title') || 'Returns & Refunds'}
            </h1>
            <p className="text-sm font-light text-neutral-300 tracking-wide mt-2">
              {t('subtitle') || 'Our policy on returns, refunds, and exchanges.'}
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

            {/* Section 1: Return Policy Overview */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section1.title') || '1. Return Policy Overview'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section1.content1') || 'Due to hygiene and safety regulations, most hair care products cannot be returned once opened or used. However, certain products may be eligible for return under specific conditions.'}
                </p>
                <p className="text-sm font-light">
                  {t('section1.content2') || 'Please read this policy carefully to understand which products can be returned and under what circumstances.'}
                </p>
              </div>
            </section>

            {/* Section 2: Non-Returnable Products */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section2.title') || '2. Non-Returnable Products'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section2.content1') || 'For health and safety reasons, the following products cannot be returned once opened or used:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section2.item1') || 'Shampoos and conditioners'}</li>
                  <li>{t('section2.item2') || 'Hair styling products (gels, mousses, sprays, waxes)'}</li>
                  <li>{t('section2.item3') || 'Hair treatments and masks'}</li>
                  <li>{t('section2.item4') || 'Hair oils and serums'}</li>
                  <li>{t('section2.item5') || 'Any other opened or used hair care products'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section2.content2') || 'These products are non-returnable for hygiene and safety reasons, in accordance with consumer protection regulations.'}
                </p>
              </div>
            </section>

            {/* Section 3: Returnable Products */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section3.title') || '3. Returnable Products'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section3.content1') || 'The following products may be returned within 30 days of delivery if they are unused, unopened, and in their original packaging:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section3.item1') || 'Hair dryers and other electrical devices'}</li>
                  <li>{t('section3.item2') || 'Hair styling tools (brushes, combs, accessories)'}</li>
                  <li>{t('section3.item3') || 'Unopened, sealed hair care products'}</li>
                  <li>{t('section3.item4') || 'Defective or damaged products (regardless of type)'}</li>
                  <li>{t('section3.item5') || 'Incorrectly shipped items'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section3.content2') || 'To be eligible for return, products must be in their original condition, unused, and with all original packaging, tags, and accessories included.'}
                </p>
              </div>
            </section>

            {/* Section 4: Return Process */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section4.title') || '4. Return Process'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section4.content1') || 'To initiate a return, please follow these steps:'}
                </p>
                <ol className="text-sm font-light space-y-2 pl-6 list-decimal">
                  <li>{t('section4.item1') || 'Contact us within 30 days of delivery at info@georgiobandera.se or through your account dashboard'}</li>
                  <li>{t('section4.item2') || 'Provide your order number and reason for return'}</li>
                  <li>{t('section4.item3') || 'We will review your request and provide return instructions if eligible'}</li>
                  <li>{t('section4.item4') || 'Package the item securely in its original packaging'}</li>
                  <li>{t('section4.item5') || 'Ship the item back to us using the provided return address'}</li>
                </ol>
                <p className="text-sm font-light mt-4">
                  {t('section4.content2') || 'Please note that return shipping costs are the responsibility of the customer unless the product is defective, damaged, or incorrectly shipped.'}
                </p>
              </div>
            </section>

            {/* Section 5: Refund Process */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section5.title') || '5. Refund Process'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section5.content1') || 'Once we receive and inspect your returned item, we will process your refund:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section5.item1') || 'Refunds will be processed to the original payment method'}</li>
                  <li>{t('section5.item2') || 'Processing time: 5-10 business days after we receive the returned item'}</li>
                  <li>{t('section5.item3') || 'You will receive an email confirmation once the refund has been processed'}</li>
                  <li>{t('section5.item4') || 'The refund amount will exclude original shipping costs (unless the return is due to our error)'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section5.content2') || 'Please note that it may take additional time for the refund to appear in your account, depending on your bank or payment provider.'}
                </p>
              </div>
            </section>

            {/* Section 6: Exchanges */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section6.title') || '6. Exchanges'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section6.content1') || 'We do not offer direct exchanges. If you wish to exchange a product, please return the original item following our return process and place a new order for the desired product.'}
                </p>
                <p className="text-sm font-light">
                  {t('section6.content2') || 'This ensures you receive the correct product quickly while we process your return separately.'}
                </p>
              </div>
            </section>

            {/* Section 7: Defective or Damaged Products */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section7.title') || '7. Defective or Damaged Products'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section7.content1') || 'If you receive a defective or damaged product, please contact us immediately:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section7.item1') || 'Contact us within 7 days of delivery'}</li>
                  <li>{t('section7.item2') || 'Provide photos of the defect or damage'}</li>
                  <li>{t('section7.item3') || 'Include your order number'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section7.content2') || 'We will arrange for a replacement or full refund, including return shipping costs, at no cost to you.'}
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
                  {t('section8.content1') || 'If you have any questions about our returns and refunds policy, or need assistance with a return, please contact us:'}
                </p>
                <div className="text-sm font-light space-y-1 pl-4">
                  <p>{t('section8.email') || 'Email: info@georgiobandera.se'}</p>
                  <p>{t('section8.website') || 'Website: www.georgiobandera.se'}</p>
                </div>
                <p className="text-sm font-light mt-4">
                  {t('section8.content2') || 'Our customer service team is here to help and will respond to your inquiry as soon as possible.'}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

