import { describe, expect, it } from 'vitest';

import { sanitizeAnalyticsMetadata } from '@/lib/analytics-events';

describe('analytics metadata', () => {
  it('removes personal form data', () => {
    expect(
      sanitizeAnalyticsMetadata({
        email: 'person@example.com',
        firstName: 'Person',
        cta_location: 'hero',
        platform: 'ios',
      })
    ).toEqual({ cta_location: 'hero', platform: 'ios' });
  });
});
