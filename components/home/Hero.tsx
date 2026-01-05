'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { HeroImage } from '@/types/database';

const ROTATION_INTERVAL = 5000; // 5 seconds per image

export default function Hero() {
  const t = useTranslations('home');
  const locale = useLocale();
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch hero images from API
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const response = await fetch('/api/hero-images');
        const data = await response.json() as { images?: HeroImage[] };
        if (data.images && data.images.length > 0) {
          setHeroImages(data.images);
        }
      } catch (error) {
        console.error('Error fetching hero images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroImages();
  }, []);

  // Auto-rotate images (pauses on hover)
  useEffect(() => {
    if (isPaused || heroImages.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        setIsTransitioning(false);
      }, 500); // Half of transition duration for smooth fade
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused, heroImages.length]);

  // Manual navigation
  const goToImage = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsTransitioning(false);
    }, 500);
  };

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
      {/* Elegant background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
      </div>

      {/* Subtle gold accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center gap-16 px-6 py-24 lg:flex-row lg:items-center lg:gap-20">
        {/* Left: Premium text content */}
        <div className="z-10 max-w-2xl space-y-8 text-center lg:text-left">
          {/* Subtitle with elegant spacing */}
          <div className="inline-block">
            <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
              {t('subtitle')}
            </p>
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
          </div>

          {/* Main heading with refined typography */}
          <h1 className="text-5xl font-light tracking-[0.02em] leading-[1.1] sm:text-6xl lg:text-7xl">
            <span className="block font-extralight">Georgio</span>
            <span className="block mt-1 font-light tracking-wider">Bandera</span>
          </h1>

          {/* Description with elegant spacing */}
          <p className="max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg lg:text-xl">
            {t('description')}
          </p>

          {/* Premium CTA buttons */}
          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:items-center lg:justify-start">
            <Link
              href="/shop"
              className="group relative overflow-hidden rounded-sm bg-white px-8 py-3.5 text-sm font-medium tracking-wider text-black transition-all duration-300 hover:bg-neutral-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10">{t('shopNow')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
            <Link
              href="/shop?featured=true"
              className="group relative text-sm font-light tracking-wider text-neutral-300 transition-colors duration-300 hover:text-amber-400"
            >
              {t('viewBestsellers')}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-amber-400 transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>
        </div>

        {/* Right: Hero image carousel with premium styling */}
        <div 
          className="relative z-10 w-full max-w-lg lg:max-w-xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative">
            {/* Outer glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 opacity-50 blur-xl" />
            
            {/* Main image container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-800/80 to-neutral-950/90 backdrop-blur-sm shadow-2xl">
              {/* Elegant overlay pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.05)_0%,_transparent_50%)] z-10" />
              
              {/* Image carousel */}
              {heroImages.map((image, index) => {
                const altText = locale === 'sv' 
                  ? (image.alt_text_sv || image.alt_text_en || 'Hero image')
                  : (image.alt_text_en || image.alt_text_sv || 'Hero image');
                
                return (
                  <div
                    key={image.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentImageIndex
                        ? 'opacity-100 z-[2]'
                        : 'opacity-0 z-[1] pointer-events-none'
                    }`}
                    style={{
                      backgroundImage: `url(${image.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {/* Hidden img for loading detection */}
                    <img
                      src={image.url}
                      alt={altText}
                      className="w-full h-full object-cover opacity-0"
                      onLoad={() => {
                        setImagesLoaded(prev => new Set(prev).add(index));
                      }}
                      onError={(e) => {
                        // Hide image container if it fails to load
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
              
              {/* Fallback placeholder - only shows if no images have loaded */}
              {imagesLoaded.size === 0 && (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center px-8 text-center z-0 pointer-events-none">
                <div className="mb-6">
                  <p className="text-[9px] font-light uppercase tracking-[0.5em] text-amber-400/60">
                    {t('signatureCollection')}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mx-auto" />
                  <p className="text-sm font-light tracking-wider text-neutral-400">
                    {t('heroImagePlaceholder')}
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
                    {t('heroImageDescription')}
                  </p>
                </div>
              </div>
              )}
            </div>

            {/* Image indicators (dots) */}
            {heroImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`h-1.5 transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'w-8 bg-amber-400/80'
                        : 'w-1.5 bg-white/30 hover:bg-white/50'
                    } rounded-full`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Decorative corner accents */}
            <div className="absolute -top-2 -left-2 h-8 w-8 border-t-2 border-l-2 border-amber-500/30 z-20" />
            <div className="absolute -bottom-2 -right-2 h-8 w-8 border-b-2 border-r-2 border-amber-500/30 z-20" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-light uppercase tracking-wider text-neutral-500">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-neutral-600 to-transparent" />
        </div>
      </div>
    </section>
  );
}

