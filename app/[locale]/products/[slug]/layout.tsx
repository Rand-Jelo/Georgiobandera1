import { Metadata } from 'next';
import { getDB } from '@/lib/db/client';
import { getProductBySlug, getProductImages } from '@/lib/db/queries/products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://georgiobandera.se';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
  const { slug, locale } = await params;
  
  try {
    const db = getDB();
    const product = await getProductBySlug(db, slug);
    
    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
      };
    }

    const images = await getProductImages(db, product.id);
    const productName = locale === 'sv' ? product.name_sv : product.name_en;
    const productDescription = locale === 'sv' 
      ? (product.description_sv || product.description_en || '')
      : (product.description_en || product.description_sv || '');
    
    // Clean description for meta (remove HTML, limit length)
    const cleanDescription = productDescription
      .replace(/<[^>]*>/g, '')
      .substring(0, 160)
      .trim();
    
    const productImage = images.length > 0 
      ? `${SITE_URL}${images[0].url}` 
      : `${SITE_URL}/logo-white.png`;
    
    const productUrl = `${SITE_URL}/${locale}/products/${slug}`;
    const price = product.compare_at_price && product.compare_at_price > product.price
      ? product.compare_at_price
      : product.price;
    const currency = 'SEK';

    return {
      title: `${productName} | Georgio Bandera`,
      description: cleanDescription || `${productName} - Premium hair care products from Georgio Bandera`,
      keywords: [
        productName,
        'Georgio Bandera',
        'hair care',
        'premium hair products',
        locale === 'sv' ? 'hårvård' : 'hair care',
      ].join(', '),
      openGraph: {
        title: productName,
        description: cleanDescription || `${productName} - Premium hair care products`,
        url: productUrl,
        siteName: 'Georgio Bandera',
        images: [
          {
            url: productImage,
            width: 1200,
            height: 630,
            alt: productName,
          },
        ],
        locale: locale === 'sv' ? 'sv_SE' : 'en_US',
        type: 'product',
      },
      twitter: {
        card: 'summary_large_image',
        title: productName,
        description: cleanDescription || `${productName} - Premium hair care products`,
        images: [productImage],
      },
      alternates: {
        canonical: productUrl,
        languages: {
          'en': `${SITE_URL}/en/products/${slug}`,
          'sv': `${SITE_URL}/sv/products/${slug}`,
        },
      },
      other: {
        'product:price:amount': price.toString(),
        'product:price:currency': currency,
        'product:availability': product.stock_quantity > 0 || !product.track_inventory 
          ? 'in stock' 
          : 'out of stock',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product | Georgio Bandera',
      description: 'Premium hair care products from Georgio Bandera',
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

