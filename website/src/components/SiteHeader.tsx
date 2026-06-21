'use client';

import * as React from 'react';
import { Menu, X } from 'lucide-react';

import { BrandLogo } from './BrandLogo';
import { navigationLinks } from '@/config/site';
import { analyticsEvents } from '@/lib/analytics-events';
import { trackEvent } from '@/lib/analytics-client';

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="site-header">
      <a className="site-header__brand" href="#top" aria-label="Hale home">
        <BrandLogo compact />
      </a>

      <nav className="site-header__nav" aria-label="Main navigation">
        {navigationLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <a
        className="button button--primary site-header__cta"
        href="#beta-access"
        onClick={() => trackEvent(analyticsEvents.heroPrimaryCtaClick, { cta_location: 'header' })}
      >
        Get beta access
      </a>

      <button
        className="site-header__menu"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>

      <div id="mobile-menu" className="site-header__mobile" hidden={!open}>
        {navigationLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a
          className="button button--primary"
          href="#beta-access"
          onClick={() => {
            setOpen(false);
            trackEvent(analyticsEvents.heroPrimaryCtaClick, { cta_location: 'mobile-menu' });
          }}
        >
          Get beta access
        </a>
      </div>
    </header>
  );
}
