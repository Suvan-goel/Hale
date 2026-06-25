import { LandingPage } from '@/components/LandingPage';
import { getPublicSiteConfig } from '@/config/site';
import { normalizeHeroFocus } from '@/content/landing';
import { buildPricing } from '@/lib/pricing';
import { buildStoreLinks } from '@/lib/store-links';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const config = getPublicSiteConfig();
  const pricing = buildPricing(config);
  const storeLinks = buildStoreLinks(config);
  const focus = normalizeHeroFocus(params.focus);

  return (
    <>
      <LandingPage focus={focus} pricing={pricing} storeLinks={storeLinks} betaSignupEnabled={config.betaSignupEnabled} />
      <StructuredData />
    </>
  );
}

function StructuredData() {
  const config = getPublicSiteConfig();
  const pricing = buildPricing(config);
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Hale',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'iOS, Android',
    description:
      'Hale checks strength, balance and mobility with a phone camera, then gives a simple home plan.',
  };

  if (pricing.kind === 'configured') {
    jsonLd.offers = {
      '@type': 'Offer',
      price: pricing.beta,
      priceCurrency: pricing.currency,
      category: 'Beta access',
    };
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
