'use client';

import type { AnalyticsEventName, AnalyticsMetadata } from './analytics-events';

export function trackEvent(name: AnalyticsEventName, metadata: AnalyticsMetadata = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('hale-analytics-event', {
      detail: { name, metadata },
    })
  );
}
