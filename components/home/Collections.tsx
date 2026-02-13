'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

interface Collection {
  id: string;
  name_en: string;
  name_sv: string;
  description_en: string | null;
  description_sv: string | null;
  href: string;
  image_url: string | null;
  sort_order: number;
  active: number;
}

interface HomepageContent {
  title_en: string | null;
  title_sv: string | null;
  subtitle_en: string | null;
  subtitle_sv: string | null;
}

export default function Collections() {
  const locale = useLocale();
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
    fetchCollections();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/homepage-content/collections', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json() as { content?: HomepageContent };
        if (data.content) {
          setContent(data.content);
        }
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json() as { collections?: Collection[] };
        if (data.collections) {
          setCollections(data.collections);
        }
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const title = locale === 'sv'
    ? (content?.title_sv || 'Upptäck Vårt Sortiment')
    : (content?.title_en || 'Discover Our Range');

  const subtitle = locale === 'sv'
    ? (content?.subtitle_sv || 'Utforska Kollektioner')
    : (content?.subtitle_en || 'Explore Collections');

  return (
    <section className="relative bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <div className="inline-block">
            <p className="text-[9px] font-light uppercase tracking-[0.4em] text-neutral-400 sm:text-[10px]">
              {subtitle}
            </p>
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto sm:mt-3 sm:w-20" />
          </div>
          <h2 className="mt-4 text-2xl font-light tracking-wide text-neutral-900 sm:mt-6 sm:text-3xl md:text-4xl">
            {title}
          </h2>
        </div>

        {/* Collections grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-300"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p>No collections available</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-7 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
            {collections.map((collection) => {
              const name = locale === 'sv' ? collection.name_sv : collection.name_en;
              const description = locale === 'sv' ? collection.description_sv : collection.description_en;

              // Update href to use collection parameter instead of custom href
              const collectionHref = `/shop?collection=${collection.id}`;

              return (
                <Link
                  key={collection.id}
                  href={collectionHref}
                  className="group relative overflow-hidden bg-neutral-50 border border-neutral-200/50 transition-all duration-500 hover:border-amber-500/30 hover:shadow-xl"
                >
                  {/* Image */}
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(0,0,0,0.05)_0%,_transparent_50%)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center space-y-2 sm:space-y-3">
                            <div className="inline-block h-1 w-12 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent sm:w-16" />
                            <p className="text-[10px] font-light tracking-wider text-neutral-400 sm:text-xs">
                              Collection Image
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <h3 className="text-base font-light tracking-wide text-neutral-900 mb-2 group-hover:text-amber-600 transition-colors duration-300 sm:text-lg">
                      {name}
                    </h3>
                    <p className="text-xs text-neutral-500 font-light sm:text-sm">
                      {description || ''}
                    </p>

                    {/* Hover indicator */}
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-light tracking-wider text-neutral-400 group-hover:text-amber-600 transition-colors duration-300 sm:mt-4 sm:text-xs">
                      <span>{locale === 'sv' ? 'Utforska' : 'Explore'}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-amber-500/0 group-hover:border-amber-500/30 transition-colors duration-500 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

