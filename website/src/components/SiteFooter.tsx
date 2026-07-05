import Link from 'next/link';

import { BrandLogo } from './BrandLogo';
import { ConsentPreferencesButton } from './ConsentBanner';
import { StoreButtons } from './StoreButtons';
import { getPublicSiteConfig } from '@/config/site';
import { buildStoreLinks } from '@/lib/store-links';

export function SiteFooter() {
  const config = getPublicSiteConfig();
  const storeLinks = buildStoreLinks(config);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <BrandLogo />
          <p>
            Hale checks strength, balance and mobility with your phone camera, then guides a simple home strength
            plan for the menopause years.
          </p>
          <p className="site-footer__beta">Currently in beta.</p>
        </div>

        <div className="site-footer__actions">
          <StoreButtons links={storeLinks} ctaLocation="footer" fallbackLabel="Join beta list" />
        </div>

        <div className="site-footer__links" aria-label="Footer links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          {config.supportEmail ? <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a> : null}
          <ConsentPreferencesButton />
        </div>

        <p className="site-footer__fine">Copyright {year} Hale. General fitness and wellbeing only. Not medical advice.</p>
      </div>
    </footer>
  );
}
