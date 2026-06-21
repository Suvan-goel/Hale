'use client';

import { ArrowRight, ExternalLink, Smartphone } from 'lucide-react';

import type { StoreLink } from '@/lib/store-links';
import { analyticsEvents } from '@/lib/analytics-events';
import { trackEvent } from '@/lib/analytics-client';

interface StoreButtonsProps {
  links: readonly StoreLink[];
  ctaLocation: string;
  fallbackLabel?: string;
  className?: string;
}

export function StoreButtons({ links, ctaLocation, fallbackLabel = 'Join the Hale beta', className }: StoreButtonsProps) {
  if (links.length === 0) {
    return (
      <div className={className}>
        <a
          className="button button--primary"
          href="#beta-access"
          onClick={() => trackEvent(analyticsEvents.pricingCtaClick, { cta_location: ctaLocation, target: 'signup' })}
        >
          {fallbackLabel}
          <ArrowRight aria-hidden="true" size={18} />
        </a>
      </div>
    );
  }

  return (
    <div className={`store-buttons ${className ?? ''}`}>
      {links.map((link) => (
        <a
          key={link.platform}
          className="store-button"
          href={link.href}
          aria-label={link.ariaLabel}
          rel="noopener noreferrer"
          target="_blank"
          onClick={() =>
            trackEvent(link.platform === 'ios' ? analyticsEvents.appStoreClick : analyticsEvents.googlePlayClick, {
              cta_location: ctaLocation,
              platform: link.platform,
            })
          }
        >
          <span className="store-button__icon" aria-hidden="true">
            <Smartphone size={20} />
          </span>
          <span>
            <span className="store-button__eyebrow">Open</span>
            <span className="store-button__label">{link.label}</span>
          </span>
          <ExternalLink aria-hidden="true" size={17} />
        </a>
      ))}
    </div>
  );
}
