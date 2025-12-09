// This is the root layout that redirects to the locale-based layout
import { redirect } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will be handled by middleware, but we keep this for fallback
  return children;
}
