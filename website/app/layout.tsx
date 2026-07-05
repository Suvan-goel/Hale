import type { Metadata, Viewport } from 'next';

import './globals.css';

import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { ConsentBanner } from '@/components/ConsentBanner';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { brandAssets } from '@/config/brand';
import { getPublicSiteConfig } from '@/config/site';

const config = getPublicSiteConfig();
const siteUrl = new URL(config.siteUrl);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: 'Hale - Movement Check-Up and Home Plan for the Menopause Years',
  description:
    'Muscle and strength change faster through the menopause years. Hale measures strength, balance and mobility with a phone-camera check-up, then guides a simple home strength plan.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Hale - Movement Check-Up and Home Plan for the Menopause Years',
    description:
      'Muscle and strength change faster through the menopause years. Hale measures strength, balance and mobility with a phone-camera check-up, then guides a simple home strength plan.',
    url: '/',
    siteName: 'Hale',
    images: [
      {
        url: brandAssets.ogImage,
        width: 1672,
        height: 941,
        alt: 'Hale movement training in a calm home setting.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hale - Movement Check-Up and Home Plan for the Menopause Years',
    description:
      'Muscle and strength change faster through the menopause years. Hale measures strength, balance and mobility with a phone-camera check-up, then guides a simple home strength plan.',
    images: [brandAssets.ogImage],
  },
  icons: {
    icon: '/favicon.png',
    apple: brandAssets.appIcon,
  },
};

export const viewport: Viewport = {
  themeColor: '#F4EDE6',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <AnalyticsProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <ConsentBanner />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
