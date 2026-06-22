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
  title: 'Hale - Phone Camera Movement Check-Up and Home Training',
  description:
    'Hale checks your strength, balance and mobility with your phone camera, then gives you a simple home training plan.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Hale - Phone Camera Movement Check-Up and Home Training',
    description:
      'Hale checks your strength, balance and mobility with your phone camera, then gives you a simple home training plan.',
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
    title: 'Hale - Phone Camera Movement Check-Up and Home Training',
    description:
      'Hale checks your strength, balance and mobility with your phone camera, then gives you a simple home training plan.',
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
