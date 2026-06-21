import type { MetadataRoute } from 'next';

import { getPublicSiteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  const config = getPublicSiteConfig();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${config.siteUrl.replace(/\/$/, '')}/sitemap.xml`,
  };
}
