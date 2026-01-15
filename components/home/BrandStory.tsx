'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface SiteImage {
  id: string;
  section: string;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
  active: number;
}

export default function BrandStory() {
  const locale = useLocale();
  const [image, setImage] = useState<SiteImage | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch('/api/site-images/philosophy');
        const data = await response.json() as { image?: SiteImage };
        if (data.image) {
          setImage(data.image);
        }
      } catch (error) {
        console.error('Error fetching philosophy image:', error);
      }
    };

    fetchImage();
  }, []);

  const altText = locale === 'sv' ? image?.alt_text_sv : image?.alt_text_en;

  return (
    <section className="relative bg-neutral-950 text-white py-16 overflow-hidden sm:py-20 md:py-24 lg:py-32">
      {/* Elegant background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:gap-12 md:gap-16 lg:grid-cols-2 lg:gap-20 lg:items-center">
          {/* Left: Content */}
          <div className="space-y-6 sm:space-y-7 md:space-y-8">
            <div className="inline-block">
              <p className="text-[9px] font-light uppercase tracking-[0.4em] text-amber-400/80 sm:text-[10px]">
                Our Philosophy
              </p>
              <div className="mt-2 h-px w-12 bg-gradient-to-r from-amber-500/50 to-transparent sm:w-16" />
            </div>

            <h2 className="text-3xl font-light tracking-wide leading-tight sm:text-4xl md:text-5xl">
              Crafted for Excellence,<br />
              <span className="text-amber-400/90">Designed for You</span>
            </h2>

            <div className="space-y-4 text-neutral-300 leading-relaxed sm:space-y-5 md:space-y-6">
              <p className="text-sm sm:text-base md:text-lg">
                At Georgio Bandera, we believe that exceptional hair care is an art form. 
                Each product is meticulously formulated with premium ingredients, combining 
                time-honored techniques with cutting-edge innovation.
              </p>
              <p className="text-sm sm:text-base md:text-lg">
                Our commitment to quality extends beyond the bottle—we create experiences 
                that elevate your daily routine, transforming simple moments into rituals 
                of self-care and sophistication.
              </p>
            </div>

            {/* Values grid */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10 sm:gap-5 sm:pt-7 md:gap-6 md:pt-8">
              <div>
                <p className="text-[10px] font-light uppercase tracking-[0.3em] text-amber-400/60 mb-1.5 sm:text-xs sm:mb-2">
                  Premium
                </p>
                <p className="text-xs text-neutral-400 sm:text-sm">
                  Only the finest ingredients
                </p>
              </div>
              <div>
                <p className="text-[10px] font-light uppercase tracking-[0.3em] text-amber-400/60 mb-1.5 sm:text-xs sm:mb-2">
                  Professional
                </p>
                <p className="text-xs text-neutral-400 sm:text-sm">
                  Salon-grade formulations
                </p>
              </div>
              <div>
                <p className="text-[10px] font-light uppercase tracking-[0.3em] text-amber-400/60 mb-1.5 sm:text-xs sm:mb-2">
                  Sustainable
                </p>
                <p className="text-xs text-neutral-400 sm:text-sm">
                  Ethically sourced materials
                </p>
              </div>
              <div>
                <p className="text-[10px] font-light uppercase tracking-[0.3em] text-amber-400/60 mb-1.5 sm:text-xs sm:mb-2">
                  Effective
                </p>
                <p className="text-xs text-neutral-400 sm:text-sm">
                  Proven results you'll love
                </p>
              </div>
            </div>
          </div>

          {/* Right: Visual element */}
          <div className="relative order-first lg:order-last max-w-md mx-auto lg:max-w-none">
            <div className="aspect-square relative">
              {/* Decorative frame */}
              <div className="absolute inset-0 border border-white/10">
                <div className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-amber-500/30 sm:h-12 sm:w-12 md:h-16 md:w-16" />
                <div className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-amber-500/30 sm:h-12 sm:w-12 md:h-16 md:w-16" />
                <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-amber-500/30 sm:h-12 sm:w-12 md:h-16 md:w-16" />
                <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-amber-500/30 sm:h-12 sm:w-12 md:h-16 md:w-16" />
              </div>
              
              {/* Image or placeholder */}
              {image ? (
                <>
                  {/* Loading skeleton */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-neutral-900 animate-pulse z-0" />
                  )}
                  {/* Actual image */}
                  <img
                    src={image.url}
                    alt={altText || 'Georgio Bandera Philosophy'}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-0 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 z-0">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="inline-block h-1 w-20 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent sm:w-24" />
                    <p className="text-xs font-light tracking-wider text-neutral-400 sm:text-sm">
                      Brand Image Placeholder
                    </p>
                    <p className="text-[10px] text-neutral-500 sm:text-xs">
                      High-end product photography or brand imagery
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
