'use client';

import * as React from 'react';

import { getPublicSiteConfig } from '@/config/site';
import { analyticsEvents, sanitizeAnalyticsMetadata, type AnalyticsEventName, type AnalyticsMetadata } from '@/lib/analytics-events';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const consentKey = 'hale.analytics-consent';
const conversionPrefix = 'hale.conversion-fired.';

function getConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(consentKey) === 'yes';
}

function loadGtag(scriptId: string): void {
  if (document.getElementById('hale-gtag')) return;
  const script = document.createElement('script');
  script.id = 'hale-gtag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(scriptId)}`;
  document.head.appendChild(script);
}

function gtag(...args: unknown[]): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
  window.gtag?.(...args);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const config = getPublicSiteConfig();
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setEnabled(getConsent());
    sync();
    window.addEventListener('hale-consent-changed', sync);
    return () => window.removeEventListener('hale-consent-changed', sync);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const measurementId = config.analytics.gaMeasurementId || config.analytics.googleAdsId;
    if (!measurementId) return;

    loadGtag(measurementId);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    window.gtag('js', new Date());

    if (config.analytics.gaMeasurementId) {
      window.gtag('config', config.analytics.gaMeasurementId, { send_page_view: false });
    }
    if (config.analytics.googleAdsId) {
      window.gtag('config', config.analytics.googleAdsId);
    }
  }, [config.analytics.gaMeasurementId, config.analytics.googleAdsId, enabled]);

  React.useEffect(() => {
    if (!enabled) return;
    sendEvent(analyticsEvents.landingPageView, {}, config);

    const sentDepths = new Set<number>();
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.round((window.scrollY / scrollable) * 100);
      if (depth >= 50 && !sentDepths.has(50)) {
        sentDepths.add(50);
        sendEvent(analyticsEvents.scrollDepth50, { depth: 50 }, config);
      }
      if (depth >= 90 && !sentDepths.has(90)) {
        sentDepths.add(90);
        sendEvent(analyticsEvents.scrollDepth90, { depth: 90 }, config);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [config, enabled]);

  React.useEffect(() => {
    const listener = (event: Event) => {
      if (!enabled) return;
      const custom = event as CustomEvent<{ name: AnalyticsEventName; metadata: AnalyticsMetadata }>;
      const detail = custom.detail;
      if (!detail?.name) return;
      sendEvent(detail.name, detail.metadata, config);
      maybeSendConversion(detail.name, detail.metadata, config);
    };
    window.addEventListener('hale-analytics-event', listener);
    return () => window.removeEventListener('hale-analytics-event', listener);
  }, [config, enabled]);

  return <>{children}</>;
}

function sendEvent(name: AnalyticsEventName, metadata: AnalyticsMetadata, config: ReturnType<typeof getPublicSiteConfig>): void {
  if (!window.gtag) return;
  const safe = sanitizeAnalyticsMetadata({
    ...metadata,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
  window.gtag('event', name, safe);

  if (!config.analytics.gaMeasurementId) {
    gtag('event', name, safe);
  }
}

function maybeSendConversion(
  name: AnalyticsEventName,
  metadata: AnalyticsMetadata,
  config: ReturnType<typeof getPublicSiteConfig>
): void {
  if (!config.analytics.googleAdsId || !window.gtag) return;

  if (name === analyticsEvents.betaSignupSubmitted && config.analytics.googleAdsSignupLabel) {
    sendOnce('signup', `${config.analytics.googleAdsId}/${config.analytics.googleAdsSignupLabel}`);
  }

  if (name === analyticsEvents.appStoreClick && config.analytics.googleAdsIosClickLabel) {
    sendOnce('ios-click', `${config.analytics.googleAdsId}/${config.analytics.googleAdsIosClickLabel}`);
  }

  if (name === analyticsEvents.googlePlayClick && config.analytics.googleAdsAndroidClickLabel) {
    sendOnce('android-click', `${config.analytics.googleAdsId}/${config.analytics.googleAdsAndroidClickLabel}`);
  }

  function sendOnce(key: string, sendTo: string): void {
    const storageKey = `${conversionPrefix}${key}`;
    if (window.sessionStorage.getItem(storageKey) === '1') return;
    window.sessionStorage.setItem(storageKey, '1');
    window.gtag?.('event', 'conversion', {
      send_to: sendTo,
      cta_location: metadata.cta_location,
      page_path: window.location.pathname,
    });
  }
}
