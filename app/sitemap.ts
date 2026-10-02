import type { MetadataRoute } from 'next';
import { publicPages, siteUrl } from '@/lib/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map(path => ({ url: `${siteUrl}${path}`, lastModified: '2026-10-03' }));
}
