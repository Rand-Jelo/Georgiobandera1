'use client';

import { Link } from '@/lib/i18n/routing';

interface Collection {
  id: string;
  name: string;
  description: string;
  href: string;
  imageUrl?: string;
}

const collections: Collection[] = [
  {
    id: '1',
    name: 'Signature Line',
    description: 'Our most beloved formulations',
    href: '/shop?category=shampoo',
  },
  {
    id: '2',
    name: 'Treatment Collection',
    description: 'Deep repair and restoration',
    href: '/shop?category=treatments',
  },
  {
    id: '3',
    name: 'Styling Essentials',
    description: 'Professional styling products',
    href: '/shop?category=styling',
  },
];

export default function Collections() {

  return (
    <section className="relative bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <div className="inline-block">
            <p className="text-[9px] font-light uppercase tracking-[0.4em] text-neutral-400 sm:text-[10px]">
              Explore Collections
            </p>
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto sm:mt-3 sm:w-20" />
          </div>
          <h2 className="mt-4 text-2xl font-light tracking-wide text-neutral-900 sm:mt-6 sm:text-3xl md:text-4xl">
            Discover Our Range
          </h2>
        </div>

        {/* Collections grid */}
        <div className="grid gap-6 sm:gap-7 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              href={collection.href}
              className="group relative overflow-hidden bg-neutral-50 border border-neutral-200/50 transition-all duration-500 hover:border-amber-500/30 hover:shadow-xl"
            >
              {/* Image placeholder */}
              <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(0,0,0,0.05)_0%,_transparent_50%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2 sm:space-y-3">
                    <div className="inline-block h-1 w-12 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent sm:w-16" />
                    <p className="text-[10px] font-light tracking-wider text-neutral-400 sm:text-xs">
                      Collection Image
                    </p>
                  </div>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6">
                <h3 className="text-base font-light tracking-wide text-neutral-900 mb-2 group-hover:text-amber-600 transition-colors duration-300 sm:text-lg">
                  {collection.name}
                </h3>
                <p className="text-xs text-neutral-500 font-light sm:text-sm">
                  {collection.description}
                </p>
                
                {/* Hover indicator */}
                <div className="mt-3 flex items-center gap-2 text-[10px] font-light tracking-wider text-neutral-400 group-hover:text-amber-600 transition-colors duration-300 sm:mt-4 sm:text-xs">
                  <span>Explore</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-amber-500/0 group-hover:border-amber-500/30 transition-colors duration-500 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

