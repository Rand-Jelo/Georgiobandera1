'use client';

import { useTranslations } from 'next-intl';

export default function TermsPage() {
  const t = useTranslations('terms');

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
              {t('title') || 'Terms & Conditions'}
            </h1>
            <p className="text-sm font-light text-neutral-300 tracking-wide mt-2">
              {t('subtitle') || 'Please read these terms carefully before using our services.'}
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

            {/* Section 1: Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section1.title') || '1. Introduction'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section1.content1') || 'Welcome to Georgio Bandera. These Terms and Conditions ("Terms") govern your access to and use of our website, products, and services. By accessing or using our services, you agree to be bound by these Terms.'}
                </p>
                <p className="text-sm font-light">
                  {t('section1.content2') || 'If you do not agree with any part of these Terms, you must not use our services. We reserve the right to update these Terms at any time, and your continued use of our services constitutes acceptance of any changes.'}
                </p>
              </div>
            </section>

            {/* Section 2: Products and Services */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section2.title') || '2. Products and Services'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section2.content1') || 'We strive to provide accurate descriptions and images of our products. However, we do not warrant that product descriptions, images, or other content on our website are accurate, complete, reliable, current, or error-free.'}
                </p>
                <p className="text-sm font-light">
                  {t('section2.content2') || 'All prices are displayed in the currency indicated and are subject to change without notice. We reserve the right to modify or discontinue any product or service at any time without prior notice.'}
                </p>
                <p className="text-sm font-light">
                  {t('section2.content3') || 'Product availability is subject to change. We cannot guarantee that products will be available at the time of your order.'}
                </p>
              </div>
            </section>

            {/* Section 3: Orders and Payment */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section3.title') || '3. Orders and Payment'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section3.content1') || 'By placing an order, you make an offer to purchase products at the prices stated, subject to these Terms. We reserve the right to accept or reject any order at our discretion.'}
                </p>
                <p className="text-sm font-light">
                  {t('section3.content2') || 'Payment must be received in full before we process and ship your order. We accept various payment methods as displayed during checkout. All payments are processed securely through our payment providers.'}
                </p>
                <p className="text-sm font-light">
                  {t('section3.content3') || 'You are responsible for providing accurate payment information. If payment cannot be processed, your order may be cancelled.'}
                </p>
              </div>
            </section>

            {/* Section 4: Shipping and Delivery */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section4.title') || '4. Shipping and Delivery'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section4.content1') || 'Shipping costs and estimated delivery times are displayed during checkout. Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or customs.'}
                </p>
                <p className="text-sm font-light">
                  {t('section4.content2') || 'Risk of loss and title for products pass to you upon delivery to the carrier. You are responsible for filing any claims with carriers for damaged or lost shipments.'}
                </p>
              </div>
            </section>

            {/* Section 5: Returns and Refunds */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section5.title') || '5. Returns and Refunds'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section5.content1') || 'Due to hygiene and safety regulations, most hair care products (including shampoos, conditioners, styling products, and treatments) cannot be returned once opened or used. These products are non-returnable for health and safety reasons.'}
                </p>
                <p className="text-sm font-light">
                  {t('section5.content2') || 'However, certain products such as hair dryers and other electrical devices may be returned within 30 days of delivery if they are unused, unopened, and in their original packaging. Return shipping costs are the responsibility of the customer unless the product is defective or incorrect.'}
                </p>
                <p className="text-sm font-light">
                  {t('section5.content3') || 'Refunds will be processed to the original payment method within 5-10 business days after we receive and inspect the returned product. For detailed return instructions, please refer to our Returns & Refunds Policy or contact our customer service.'}
                </p>
              </div>
            </section>

            {/* Section 6: Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section6.title') || '6. Intellectual Property'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section6.content1') || 'All content on this website, including text, graphics, logos, images, and software, is the property of Georgio Bandera or its content suppliers and is protected by copyright and other intellectual property laws.'}
                </p>
                <p className="text-sm font-light">
                  {t('section6.content2') || 'You may not reproduce, distribute, modify, or create derivative works from any content on this website without our express written permission.'}
                </p>
              </div>
            </section>

            {/* Section 7: Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section7.title') || '7. Limitation of Liability'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section7.content1') || 'To the fullest extent permitted by law, Georgio Bandera shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.'}
                </p>
                <p className="text-sm font-light">
                  {t('section7.content2') || 'Our total liability for any claims arising from or related to your use of our services shall not exceed the amount you paid to us in the 12 months preceding the claim.'}
                </p>
              </div>
            </section>

            {/* Section 8: Governing Law */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section8.title') || '8. Governing Law'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section8.content1') || 'These Terms shall be governed by and construed in accordance with the laws of Sweden, without regard to its conflict of law provisions.'}
                </p>
                <p className="text-sm font-light">
                  {t('section8.content2') || 'Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of Sweden.'}
                </p>
              </div>
            </section>

            {/* Section 9: Contact Information */}
            <section className="space-y-4 pt-6 border-t border-neutral-200">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section9.title') || '9. Contact Us'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section9.content1') || 'If you have any questions about these Terms & Conditions, please contact us:'}
                </p>
                <div className="text-sm font-light space-y-1 pl-4">
                  <p>{t('section9.email') || 'Email: info@georgiobandera.se'}</p>
                  <p>{t('section9.website') || 'Website: www.georgiobandera.se'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

