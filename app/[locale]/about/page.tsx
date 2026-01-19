'use client';

import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Matching Homepage */}
      <section className="relative bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white py-20 lg:py-24 overflow-hidden">
        {/* Elegant background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="relative max-w-[1600px] mx-auto px-6">
          <div className="max-w-4xl">
            {/* Elegant subtitle */}
            <div className="inline-block mb-6">
              <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                Our Story
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
            </div>
            
            {/* Main heading */}
            <h1 className="text-5xl font-extralight tracking-[0.02em] leading-[1.1] mb-4 sm:text-6xl lg:text-7xl">
              {t('about') || 'About Us'}
            </h1>
            
            {/* Description */}
            <p className="max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg lg:text-xl">
              Crafting premium hair care products for modern stylists and clients who demand excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction Section */}
          <section>
            <h2 className="text-3xl font-light tracking-wide text-neutral-900 mb-6">
              Welcome to Georgio Bandera
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
                Georgio Bandera represents a commitment to excellence in professional hair care. 
                Our products are crafted with precision, using salon-grade formulas that deliver 
                exceptional results for both stylists and their clients.
              </p>
              <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
                We understand that great hair care is an art form, requiring the perfect balance 
                of quality ingredients, innovative formulations, and professional expertise. Every 
                product in our collection is designed to enhance your styling capabilities while 
                maintaining the health and integrity of the hair.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section>
            <h2 className="text-3xl font-light tracking-wide text-neutral-900 mb-6">
              Our Mission
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
                Our mission is to provide premium hair care solutions that empower stylists to 
                create stunning looks while ensuring the health and vitality of their clients' hair. 
                We believe in the power of quality ingredients, innovative technology, and 
                professional-grade formulations.
              </p>
              <p className="text-base leading-relaxed text-neutral-700 font-light">
                Every product we create is a testament to our dedication to excellence, designed 
                to meet the demanding standards of professional salons while remaining accessible 
                to those who appreciate premium quality.
              </p>
            </div>
          </section>

          {/* Values Section */}
          <section>
            <h2 className="text-3xl font-light tracking-wide text-neutral-900 mb-6">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  Quality First
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  We never compromise on quality. Every ingredient is carefully selected, 
                  and every formula is rigorously tested to ensure it meets our high standards.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  Professional Excellence
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  Our products are developed with professional stylists in mind, ensuring 
                  they perform consistently in demanding salon environments.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  Innovation
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  We continuously explore new technologies and ingredients to stay at the 
                  forefront of hair care innovation.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  Sustainability
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  We are committed to responsible practices, from ingredient sourcing to 
                  packaging, ensuring we care for both hair and the environment.
                </p>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="pt-8 border-t border-neutral-200">
            <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
              Have questions about our products or need assistance? We're here to help.
            </p>
            <a
              href="/contact"
              className="inline-block rounded-sm bg-neutral-900 px-8 py-3.5 text-sm font-medium tracking-wider text-white transition-all duration-300 hover:bg-neutral-800 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]"
            >
              Contact Us
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}

