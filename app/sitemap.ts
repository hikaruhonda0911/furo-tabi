import type { MetadataRoute } from 'next';

import { fallbackAreaOptions } from '@/constants/areas';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

  // 都道府県別の検索ページ（都道府県単体で検索する主要導線）
  const areaPages: MetadataRoute.Sitemap = fallbackAreaOptions.map((area) => ({
    url: `${baseUrl}/?areas=${area.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...areaPages,
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-03-13'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-03-13'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2026-03-13'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
