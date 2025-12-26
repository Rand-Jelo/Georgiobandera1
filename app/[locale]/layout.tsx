import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { routing } from '@/lib/i18n/routing';
import { Geist, Geist_Mono } from "next/font/google";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { OrganizationStructuredData } from '@/components/seo/StructuredData';
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://georgiobandera.se';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Georgio Bandera - Premium Hair Care Products',
    template: '%s | Georgio Bandera',
  },
  description: 'Premium hair care products from Georgio Bandera. Salon-grade formulas for modern stylists and clients.',
  keywords: ['hair care', 'premium hair products', 'Georgio Bandera', 'salon products', 'hair styling'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'sv_SE',
    url: SITE_URL,
    siteName: 'Georgio Bandera',
    title: 'Georgio Bandera - Premium Hair Care Products',
    description: 'Premium hair care products from Georgio Bandera. Salon-grade formulas for modern stylists and clients.',
    images: [
      {
        url: `${SITE_URL}/logo-white.png`,
        width: 1200,
        height: 630,
        alt: 'Georgio Bandera',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Georgio Bandera - Premium Hair Care Products',
    description: 'Premium hair care products from Georgio Bandera. Salon-grade formulas for modern stylists and clients.',
    images: [`${SITE_URL}/logo-white.png`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en': `${SITE_URL}/en`,
      'sv': `${SITE_URL}/sv`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <OrganizationStructuredData siteUrl={SITE_URL} />
        <NextIntlClientProvider messages={messages}>
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

