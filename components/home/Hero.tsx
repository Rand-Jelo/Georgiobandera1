'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

export default function Hero() {
  const t = useTranslations('home');

  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 opacity-40">
        {/* Abstract background stripes / gradient – acts like an image placeholder */}
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff22,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff11,_#ffffff11_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-20 lg:flex-row lg:items-center">
        {/* Left: text */}
        <div className="max-w-xl space-y-6">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-300">
            {t('subtitle')}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Georgio Bandera
          </h1>
          <p className="text-sm leading-relaxed text-neutral-200 sm:text-base">
            {t('description')}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/shop"
              className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black shadow-sm hover:bg-neutral-100 transition-colors"
            >
              {t('shopNow')}
            </Link>
            <Link
              href="/shop?featured=true"
              className="text-sm text-neutral-200 underline-offset-4 hover:underline"
            >
              {t('viewBestsellers')}
            </Link>
          </div>
        </div>

        {/* Right: "image" card / product area */}
        <div className="relative mt-4 w-full max-w-md lg:mt-0">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 shadow-2xl">
            {/* This is where we would place the real hero image later */}
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                {t('signatureCollection')}
              </p>
              <p className="mt-3 text-lg font-medium text-neutral-50">
                {t('heroImagePlaceholder')}
              </p>
              <p className="mt-2 text-sm text-neutral-300">
                {t('heroImageDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

