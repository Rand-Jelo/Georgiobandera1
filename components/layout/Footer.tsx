'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/routing';
import type { Category } from '@/types/database';

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M14 8h2V5.5A25.6 25.6 0 0 0 13.8 5C11 5 9.3 6.6 9.3 9.6V12H7v3h2.3v4h3v-4H15v-3h-2.7V9.8c0-1 .5-1.8 1.7-1.8Z" />
    </svg>
  );
}

function TiktokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M15.5 5.5c.6.8 1.6 1.5 2.8 1.7v2.6c-1.4-.1-2.5-.6-3.4-1.3v5.7a4.5 4.5 0 1 1-3.9-4.5v2.7a1.7 1.7 0 1 0 1.2 1.6V4.5h3.3v1Z" />
    </svg>
  );
}

const year = new Date().getFullYear();

export default function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const currentLocale = pathname.startsWith('/sv') ? 'sv' : 'en';
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Fetch only parent categories (no parent_id)
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: unknown) => {
        const response = data as { categories?: Array<Category & { children?: Category[] }> };
        // Filter to only parent categories (no parent_id) - show all parent categories
        const parentCategories = (response.categories || [])
          .filter((cat) => !cat.parent_id);
        setCategories(parentCategories);
      })
      .catch((err) => {
        console.error('Error fetching categories for footer:', err);
      });
  }, []);

  return (
    <footer className="relative border-t border-white/10 bg-black text-neutral-300 before:absolute before:-top-px before:left-0 before:h-[1px] before:w-full before:bg-gradient-to-r before:from-black/0 before:via-black/40 before:to-black/0">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10 md:py-14">
        <div className="grid gap-8 sm:gap-10 text-[13px] md:text-sm md:grid-cols-4">
          {/* Brand / short tagline */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Georgio Bandera
            </p>
            <p className="text-xs text-neutral-400">
              Professional hair care products crafted for salons and clients who
              want a premium finish.
            </p>
          </div>

          {/* Products column */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {tCommon('products')}
            </p>

            <ul className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-6">
              {categories.length > 0 ? (
                categories.map((category) => {
                  const name = currentLocale === 'sv' ? category.name_sv : category.name_en;
                  return (
                    <li key={category.id}>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] underline decoration-transparent md:hover:decoration-amber-400 underline-offset-4 hover:gold-glow"
                      >
                        {name}
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className="text-neutral-500 text-xs">Loading categories...</li>
              )}
            </ul>
          </div>

          {/* Info column */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Information
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] underline decoration-transparent md:hover:decoration-amber-400 underline-offset-4 hover:text-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                >
                  {tCommon('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] underline decoration-transparent md:hover:decoration-amber-400 underline-offset-4 hover:text-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                >
                  {tCommon('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / policies column */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Legal &amp; policies
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] underline decoration-transparent md:hover:decoration-amber-400 underline-offset-4 hover:text-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                >
                  Terms &amp; conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] underline decoration-transparent md:hover:decoration-amber-400 underline-offset-4 hover:text-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/shipping"
                  className="hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] underline decoration-transparent md:hover:decoration-amber-400 underline-offset-4 hover:text-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                >
                  Shipping policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/returns"
                  className="hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] underline decoration-transparent md:hover:decoration-amber-400 underline-offset-4 hover:text-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                >
                  Returns &amp; refunds
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:pt-7 text-[11px] text-neutral-500 md:flex-row">
          <p>© {year} Georgiobandera.se. All rights reserved.</p>

          <div className="flex flex-col items-center gap-4 sm:gap-3 md:flex-row md:gap-6">
            {/* Social links */}
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                Follow
              </span>
              <Link
                href="https://www.instagram.com"
                aria-label="Georgio Bandera on Instagram"
                className="text-neutral-400 hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <InstagramIcon className="h-4 w-4 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </Link>
              <Link
                href="https://www.facebook.com"
                aria-label="Georgio Bandera on Facebook"
                className="text-neutral-400 hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <FacebookIcon className="h-4 w-4 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </Link>
              <Link
                href="https://www.tiktok.com"
                aria-label="Georgio Bandera on TikTok"
                className="text-neutral-400 hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <TiktokIcon className="h-4 w-4 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </Link>
            </div>

            <span className="hidden h-3 w-px bg-neutral-700 md:block" />

            {/* Language + tech note */}
            <div className="flex items-center gap-4">
              <Link
                href={pathname}
                locale="en"
                className={`text-[11px] uppercase tracking-wide transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow ${
                  currentLocale === 'en'
                    ? 'text-neutral-200 font-semibold'
                    : 'hover:text-amber-400'
                }`}
              >
                EN
              </Link>
              <Link
                href={pathname}
                locale="sv"
                className={`text-[11px] uppercase tracking-wide transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow ${
                  currentLocale === 'sv'
                    ? 'text-neutral-200 font-semibold'
                    : 'hover:text-amber-400'
                }`}
              >
                SV
              </Link>
              <span className="hidden h-3 w-px bg-neutral-700 md:block" />
              <p className="text-[11px] text-neutral-500">
                Built with Next.js &amp; Tailwind CSS
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
