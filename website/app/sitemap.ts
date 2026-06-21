import type { MetadataRoute } from 'next';

import { getPublicSiteConfig } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteConfig().siteUrl.replace(/\/$/, '');
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
