import { describe, expect, it } from 'vitest';

import { buildStoreLinks } from '@/lib/store-links';

describe('store links', () => {
  it('renders only configured valid store URLs', () => {
    expect(buildStoreLinks({ iosUrl: 'https://testflight.apple.com/join/example', androidUrl: '' })).toHaveLength(1);
    expect(buildStoreLinks({ iosUrl: '#', androidUrl: 'not-a-url' })).toHaveLength(0);
  });

  it('labels iOS and Android separately', () => {
    const links = buildStoreLinks({
      iosUrl: 'https://apps.apple.com/app/example',
      androidUrl: 'https://play.google.com/store/apps/details?id=example',
    });
    expect(links.map((link) => link.platform)).toEqual(['ios', 'android']);
    expect(links[0]?.ariaLabel).toContain('iPhone');
    expect(links[1]?.ariaLabel).toContain('Android');
  });
});
