'use client';

import { useEffect } from 'react';

interface ProductStructuredDataProps {
  product: {
    id: string;
    name_en: string;
    name_sv: string;
    description_en: string | null;
    description_sv: string | null;
    price: number;
    compare_at_price: number | null;
    sku: string | null;
    images: Array<{ url: string; alt_text_en?: string | null }>;
    category?: {
      name_en: string;
      name_sv: string;
    } | null;
  };
  locale: string;
  siteUrl: string;
}

export function ProductStructuredData({ product, locale, siteUrl }: ProductStructuredDataProps) {
  useEffect(() => {
    const productName = locale === 'sv' ? product.name_sv : product.name_en;
    const productDescription = locale === 'sv' 
      ? (product.description_sv || product.description_en || '')
      : (product.description_en || product.description_sv || '');
    
    // Clean description
    const cleanDescription = productDescription.replace(/<[^>]*>/g, '').substring(0, 500);
    
    const offerPrice = product.compare_at_price && product.compare_at_price > product.price
      ? product.price
      : product.price;
    
    const availability = 'https://schema.org/InStock'; // You can make this dynamic based on stock
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      description: cleanDescription,
      sku: product.sku || product.id,
      brand: {
        '@type': 'Brand',
        name: 'Georgio Bandera',
      },
      category: product.category 
        ? (locale === 'sv' ? product.category.name_sv : product.category.name_en)
        : 'Hair Care',
      image: product.images.map(img => `${siteUrl}${img.url}`),
      offers: {
        '@type': 'Offer',
        url: `${siteUrl}/${locale}/products/${product.id}`,
        priceCurrency: 'SEK',
        price: offerPrice.toString(),
        availability: availability,
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      },
    };

    // Remove existing structured data script if any
    const existingScript = document.querySelector('script[type="application/ld+json"][data-product]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-product]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [product, locale, siteUrl]);

  return null;
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    // Remove existing breadcrumb script if any
    const existingScript = document.querySelector('script[type="application/ld+json"][data-breadcrumb]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-breadcrumb', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-breadcrumb]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items]);

  return null;
}

interface OrganizationStructuredDataProps {
  siteUrl: string;
}

export function OrganizationStructuredData({ siteUrl }: OrganizationStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Georgio Bandera',
      url: siteUrl,
      logo: `${siteUrl}/logo-white.png`,
      sameAs: [
        // Add social media links here when available
        // 'https://www.facebook.com/georgiobandera',
        // 'https://www.instagram.com/georgiobandera',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        url: `${siteUrl}/contact`,
      },
    };

    // Remove existing organization script if any
    const existingScript = document.querySelector('script[type="application/ld+json"][data-organization]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-organization', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-organization]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [siteUrl]);

  return null;
}

