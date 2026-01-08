'use client';

import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

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
              {t('title') || 'Privacy Policy'}
            </h1>
            <p className="text-sm font-light text-neutral-300 tracking-wide mt-2">
              {t('subtitle') || 'We are committed to protecting your privacy and personal data.'}
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
                  {t('section1.content1') || 'Georgio Bandera ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.'}
                </p>
                <p className="text-sm font-light">
                  {t('section1.content2') || 'By using our website and services, you consent to the data practices described in this policy. If you do not agree with the practices described in this policy, please do not use our services.'}
                </p>
              </div>
            </section>

            {/* Section 2: Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section2.title') || '2. Information We Collect'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section2.content1') || 'We collect information that you provide directly to us, including:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section2.item1') || 'Personal information such as name, email address, phone number, and shipping address when you create an account or place an order'}</li>
                  <li>{t('section2.item2') || 'Payment information (processed securely through our payment providers)'}</li>
                  <li>{t('section2.item3') || 'Communication preferences and customer service interactions'}</li>
                  <li>{t('section2.item4') || 'Product reviews and feedback'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section2.content2') || 'We also automatically collect certain information when you visit our website, including:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section2.item5') || 'Device information (IP address, browser type, operating system)'}</li>
                  <li>{t('section2.item6') || 'Usage data (pages visited, time spent, click patterns)'}</li>
                  <li>{t('section2.item7') || 'Cookies and similar tracking technologies'}</li>
                </ul>
              </div>
            </section>

            {/* Section 3: How We Use Your Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section3.title') || '3. How We Use Your Information'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section3.content1') || 'We use the information we collect to:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section3.item1') || 'Process and fulfill your orders'}</li>
                  <li>{t('section3.item2') || 'Communicate with you about your orders, products, and services'}</li>
                  <li>{t('section3.item3') || 'Send you marketing communications (with your consent)'}</li>
                  <li>{t('section3.item4') || 'Improve our website, products, and services'}</li>
                  <li>{t('section3.item5') || 'Detect and prevent fraud and abuse'}</li>
                  <li>{t('section3.item6') || 'Comply with legal obligations'}</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Data Sharing and Disclosure */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section4.title') || '4. Data Sharing and Disclosure'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section4.content1') || 'We do not sell your personal information. We may share your information with:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section4.item1') || 'Service providers who assist us in operating our website and conducting our business (payment processors, shipping companies, email service providers)'}</li>
                  <li>{t('section4.item2') || 'Legal authorities when required by law or to protect our rights'}</li>
                  <li>{t('section4.item3') || 'Business partners with your explicit consent'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section4.content2') || 'All third parties are required to maintain the confidentiality of your information and are prohibited from using it for any purpose other than providing services to us.'}
                </p>
              </div>
            </section>

            {/* Section 5: Cookies and Tracking Technologies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section5.title') || '5. Cookies and Tracking Technologies'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section5.content1') || 'We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our website.'}
                </p>
                <p className="text-sm font-light">
                  {t('section5.content2') || 'We use both session cookies (which expire when you close your browser) and persistent cookies (which remain on your device until deleted or expired).'}
                </p>
              </div>
            </section>

            {/* Section 6: Your Rights (GDPR) */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section6.title') || '6. Your Rights'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section6.content1') || 'Under the General Data Protection Regulation (GDPR) and applicable data protection laws, you have the following rights:'}
                </p>
                <ul className="text-sm font-light space-y-2 pl-6 list-disc">
                  <li>{t('section6.item1') || 'Right to access: You can request a copy of the personal data we hold about you'}</li>
                  <li>{t('section6.item2') || 'Right to rectification: You can request correction of inaccurate or incomplete data'}</li>
                  <li>{t('section6.item3') || 'Right to erasure: You can request deletion of your personal data under certain circumstances'}</li>
                  <li>{t('section6.item4') || 'Right to restrict processing: You can request limitation of how we process your data'}</li>
                  <li>{t('section6.item5') || 'Right to data portability: You can request transfer of your data to another service'}</li>
                  <li>{t('section6.item6') || 'Right to object: You can object to processing of your data for marketing purposes'}</li>
                  <li>{t('section6.item7') || 'Right to withdraw consent: You can withdraw consent at any time where processing is based on consent'}</li>
                </ul>
                <p className="text-sm font-light mt-4">
                  {t('section6.content2') || 'To exercise these rights, please contact us using the information provided in the "Contact Us" section below.'}
                </p>
              </div>
            </section>

            {/* Section 7: Data Security */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section7.title') || '7. Data Security'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section7.content1') || 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.'}
                </p>
                <p className="text-sm font-light">
                  {t('section7.content2') || 'We use industry-standard encryption for sensitive data transmission and secure payment processing through trusted third-party providers.'}
                </p>
              </div>
            </section>

            {/* Section 8: Data Retention */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section8.title') || '8. Data Retention'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section8.content1') || 'We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.'}
                </p>
                <p className="text-sm font-light">
                  {t('section8.content2') || 'When we no longer need your personal data, we will securely delete or anonymize it in accordance with our data retention policies and applicable laws.'}
                </p>
              </div>
            </section>

            {/* Section 9: Children's Privacy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section9.title') || '9. Children\'s Privacy'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section9.content1') || 'Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.'}
                </p>
              </div>
            </section>

            {/* Section 10: Changes to This Policy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section10.title') || '10. Changes to This Policy'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section10.content1') || 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.'}
                </p>
                <p className="text-sm font-light">
                  {t('section10.content2') || 'Your continued use of our services after any changes constitutes acceptance of the updated policy.'}
                </p>
              </div>
            </section>

            {/* Section 11: Contact Us */}
            <section className="space-y-4 pt-6 border-t border-neutral-200">
              <h2 className="text-2xl font-light text-neutral-900 tracking-wide">
                {t('section11.title') || '11. Contact Us'}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed">
                <p className="text-sm font-light">
                  {t('section11.content1') || 'If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:'}
                </p>
                <div className="text-sm font-light space-y-1 pl-4">
                  <p>{t('section11.email') || 'Email: info@georgiobandera.se'}</p>
                  <p>{t('section11.website') || 'Website: www.georgiobandera.se'}</p>
                </div>
                <p className="text-sm font-light mt-4">
                  {t('section11.content2') || 'You also have the right to lodge a complaint with the Swedish Data Protection Authority (Integritetsskyddsmyndigheten) if you believe your data protection rights have been violated.'}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

