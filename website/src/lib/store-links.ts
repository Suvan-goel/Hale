export type StorePlatform = 'ios' | 'android';

export interface StoreLink {
  platform: StorePlatform;
  label: string;
  shortLabel: string;
  href: string;
  ariaLabel: string;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost');
  } catch {
    return false;
  }
}

export function buildStoreLinks(input: { iosUrl: string; androidUrl: string }): StoreLink[] {
  const links: StoreLink[] = [];
  if (isValidHttpUrl(input.iosUrl)) {
    links.push({
      platform: 'ios',
      label: 'Apple beta access',
      shortLabel: 'iPhone beta',
      href: input.iosUrl,
      ariaLabel: 'Open Hale beta access for iPhone',
    });
  }
  if (isValidHttpUrl(input.androidUrl)) {
    links.push({
      platform: 'android',
      label: 'Google Play beta',
      shortLabel: 'Android beta',
      href: input.androidUrl,
      ariaLabel: 'Open Hale beta access for Android',
    });
  }
  return links;
}

export function hasStoreLinks(links: readonly StoreLink[]): boolean {
  return links.length > 0;
}
