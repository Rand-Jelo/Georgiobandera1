'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

export default function AboutPage() {
  const tCommon = useTranslations('common');
  const t = useTranslations('about');

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
                {t('subtitle')}
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
            </div>

            {/* Main heading */}
            <h1 className="text-5xl font-extralight tracking-[0.02em] leading-[1.1] mb-4 sm:text-6xl lg:text-7xl">
              {tCommon('about')}
            </h1>

            {/* Description */}
            <p className="max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg lg:text-xl">
              {t('heroDescription')}
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
              {t('introTitle')}
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
                {t('introP1')}
              </p>
              <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
                {t('introP2')}
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section>
            <h2 className="text-3xl font-light tracking-wide text-neutral-900 mb-6">
              {t('missionTitle')}
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
                {t('missionP1')}
              </p>
              <p className="text-base leading-relaxed text-neutral-700 font-light">
                {t('missionP2')}
              </p>
            </div>
          </section>

          {/* Values Section */}
          <section>
            <h2 className="text-3xl font-light tracking-wide text-neutral-900 mb-6">
              {t('valuesTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  {t('valueQualityTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  {t('valueQualityText')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  {t('valueExcellenceTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  {t('valueExcellenceText')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  {t('valueInnovationTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  {t('valueInnovationText')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-light text-neutral-900 mb-3">
                  {t('valueSustainabilityTitle')}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 font-light">
                  {t('valueSustainabilityText')}
                </p>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="pt-8 border-t border-neutral-200">
            <p className="text-base leading-relaxed text-neutral-700 font-light mb-4">
              {t('contactCtaText')}
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-sm bg-neutral-900 px-8 py-3.5 text-sm font-medium tracking-wider text-white transition-all duration-300 hover:bg-neutral-800 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]"
            >
              {t('contactCtaButton')}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

