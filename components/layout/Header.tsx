'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/routing';
import UserMenu from '@/components/auth/UserMenu';
import CartIcon from '@/components/cart/CartIcon';
import type { Category } from '@/types/database';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.5-3 3.8-4.5 6.5-4.5s5 1.5 6.5 4.5" />
    </svg>
  );
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 transition-transform duration-300"
    >
      {isOpen ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

export default function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openParentId, setOpenParentId] = useState<string | null>(null);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [mobileOpenParentId, setMobileOpenParentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const productsRef = useRef<HTMLDivElement>(null);

  // Get current locale from pathname
  const currentLocale = pathname.startsWith('/sv') ? 'sv' : 'en';

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json() as { categories?: CategoryWithChildren[] };
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        productsRef.current &&
        !productsRef.current.contains(event.target as Node)
      ) {
        setIsProductsOpen(false);
        setOpenParentId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get category name based on locale
  const getCategoryName = (category: CategoryWithChildren) => {
    return currentLocale === 'sv' ? category.name_sv : category.name_en;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 text-white backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.7)] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-gradient-to-r after:from-white/20 after:to-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4 md:py-0">
        {/* Logo */}
        <Link href="/" className="flex items-center ml-0 md:ml-16">
          <img
            src="/logo-white.png"
            alt="Georgio Bandera Logo"
            width={90}
            height={16}
            className="object-contain hover:opacity-80 transition-opacity"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-12 text-sm font-medium md:flex">
          <Link
            href="/"
            className={`rounded-full px-2 py-1 hover:bg-white/5 hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow ${
              pathname === '/' || pathname === '/en' || pathname === '/sv'
                ? 'bg-white/5'
                : ''
            }`}
          >
            {t('home')}
          </Link>

          {/* Products with dropdown */}
          <div className="relative" ref={productsRef}>
            <button
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm tracking-wide hover:bg-white/5 hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow"
              type="button"
              onClick={() =>
                setIsProductsOpen((prev) => {
                  const next = !prev;
                  if (!next) setOpenParentId(null);
                  return next;
                })
              }
            >
              <span>{t('products')}</span>
              <span className="text-[10px]">▼</span>
            </button>

            {/* Dropdown container */}
            <div
              className={`
                absolute left-1/2 top-full -translate-x-1/2 mt-0
                bg-black/95 border border-white/10 rounded-xl shadow-xl
                px-4 pt-4 pb-3 min-w-[240px]
                transition-all duration-200
                ${
                  isProductsOpen
                    ? 'opacity-100 visible pointer-events-auto translate-y-0'
                    : 'opacity-0 invisible pointer-events-none translate-y-1'
                }
              `}
            >
              <ul className="space-y-1">
                {categories.map((category) => {
                  const hasChildren =
                    category.children && category.children.length > 0;
                  const isOpen = openParentId === category.id;

                  return (
                    <li key={category.id} className="text-sm text-neutral-100/90">
                      {hasChildren ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenParentId((prev) =>
                                prev === category.id ? null : category.id
                              );
                            }}
                            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-white/5 transition-colors"
                          >
                            <span>{getCategoryName(category)}</span>
                            <span className="text-[10px] opacity-70">
                              {isOpen ? '▲' : '▼'}
                            </span>
                          </button>

                          <div
                            className={`grid transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                              isOpen
                                ? 'grid-rows-[1fr] opacity-100 mt-1'
                                : 'grid-rows-[0fr] opacity-0 mt-0'
                            }`}
                          >
                            <ul className="space-y-1 border-l border-white/10 pl-4 overflow-hidden">
                              {category.children?.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    href={`/shop?categories=${child.id}`}
                                    className="block rounded-md px-2 py-1 text-[13px] text-neutral-200 hover:bg-white/5 hover:text-amber-400 transition-all duration-300 hover:gold-glow"
                                    onClick={() => {
                                      setIsProductsOpen(false);
                                      setOpenParentId(null);
                                    }}
                                  >
                                    {getCategoryName(child)}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <Link
                          href={`/shop?categories=${category.id}`}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-white/5 hover:text-amber-400 transition-all duration-300 hover:gold-glow"
                          onClick={() => {
                            setIsProductsOpen(false);
                            setOpenParentId(null);
                          }}
                        >
                          <span>{getCategoryName(category)}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <Link
            href="/about"
            className={`rounded-full px-2 py-1 hover:bg-white/5 hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow ${
              pathname.includes('/about') ? 'bg-white/5' : ''
            }`}
          >
            {t('about')}
          </Link>

          <Link
            href="/contact"
            className={`rounded-full px-2 py-1 hover:bg-white/5 hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow ${
              pathname.includes('/contact') ? 'bg-white/5' : ''
            }`}
          >
            {t('contact')}
          </Link>
        </nav>

        {/* Right side – language + account/cart (desktop) */}
        <div className="hidden items-center gap-4 text-xs md:flex">
          <Link
            href={pathname}
            locale="en"
              className={`uppercase tracking-wide hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow ${
              currentLocale === 'en' ? 'text-white font-semibold' : ''
            }`}
          >
            EN
          </Link>
          <Link
            href={pathname}
            locale="sv"
              className={`uppercase tracking-wide hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow ${
              currentLocale === 'sv' ? 'text-white font-semibold' : ''
            }`}
          >
            SV
          </Link>
          
          {/* User Menu - Custom styled */}
          <UserMenu
            trigger={
              <button
                type="button"
                aria-label="My account"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
              >
                <UserIcon className="h-4 w-4" />
              </button>
            }
          />

          {/* Cart Icon - Custom styled */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 relative"
          >
            <CartIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Right side – account/cart + menu toggle (mobile) */}
        <div className="flex items-center gap-3 md:hidden">
          {/* User Menu - Mobile */}
          <UserMenu
            trigger={
              <button
                type="button"
                aria-label="My account"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
              >
                <UserIcon className="h-4 w-4" />
              </button>
            }
          />

          {/* Cart Icon - Mobile */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 relative"
          >
            <CartIcon className="h-4 w-4" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen((open) => {
                if (open) {
                  // Reset expanded categories when closing menu
                  setMobileOpenParentId(null);
                }
                return !open;
              });
            }}
            className="flex items-center justify-center rounded-full border border-white/25 p-2 hover:bg-white hover:text-black transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <HamburgerIcon isOpen={mobileOpen} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 text-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow"
              onClick={() => setMobileOpen(false)}
            >
              {t('home')}
            </Link>

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
                {t('products')}
              </p>
              <ul className="space-y-1 text-sm text-neutral-200">
                {categories.map((category) => {
                  const hasChildren = category.children && category.children.length > 0;
                  const isOpen = mobileOpenParentId === category.id;
                  return (
                    <li key={category.id}>
                      {hasChildren ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setMobileOpenParentId((prev) =>
                                prev === category.id ? null : category.id
                              );
                            }}
                            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:text-amber-400 transition-all duration-300 hover:gold-glow"
                          >
                            <span>{getCategoryName(category)}</span>
                            <span className="text-[10px] opacity-70">
                              {isOpen ? '▲' : '▼'}
                            </span>
                          </button>

                          <div
                            className={`grid transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                              isOpen
                                ? 'grid-rows-[1fr] opacity-100 mt-1'
                                : 'grid-rows-[0fr] opacity-0 mt-0'
                            }`}
                          >
                            <ul className="space-y-1 border-l border-white/10 pl-4 overflow-hidden">
                              {category.children?.map((child) => (
                                <li key={child.id}>
                                  <Link
                                    href={`/shop?categories=${child.id}`}
                                    className="block rounded-md px-2 py-1 text-[13px] text-neutral-200 hover:bg-white/5 hover:text-amber-400 transition-all duration-300 hover:gold-glow"
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {getCategoryName(child)}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <Link
                          href={`/shop?categories=${category.id}`}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-white/5 hover:text-amber-400 transition-all duration-300 hover:gold-glow"
                          onClick={() => setMobileOpen(false)}
                        >
                          <span>{getCategoryName(category)}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Link
              href="/about"
              className="block hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow"
              onClick={() => setMobileOpen(false)}
            >
              {t('about')}
            </Link>

            <Link
              href="/contact"
              className="block hover:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:gold-glow"
              onClick={() => setMobileOpen(false)}
            >
              {t('contact')}
            </Link>

            <div className="pt-4 border-t border-white/10 flex items-center gap-4">
              <Link
                href={pathname}
                locale="en"
                className={`uppercase tracking-wide text-xs transition-all duration-300 hover:gold-glow ${
                  currentLocale === 'en'
                    ? 'text-white font-semibold'
                    : 'text-neutral-400 hover:text-amber-400'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                EN
              </Link>
              <Link
                href={pathname}
                locale="sv"
                className={`uppercase tracking-wide text-xs transition-all duration-300 hover:gold-glow ${
                  currentLocale === 'sv'
                    ? 'text-white font-semibold'
                    : 'text-neutral-400 hover:text-amber-400'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                SV
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
