import type { Metadata } from 'next';

export const siteUrl = 'https://astroais.app';
export const siteDescription = 'Explore your personal birth chart and kundli, multilingual AI astrology chat, and free daily goals. Start with two minutes of free chat on Astrois.';
export const publicPages = ['/', '/birth-chart', '/astrology-chat', '/daily-advice'] as const;
export function featureMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | Astrois`, description, url: path, siteName: 'Astrois', type: 'website', locale: 'en_IN', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Astrois — Personal astrology, birth charts and daily guidance' }] },
    twitter: { card: 'summary_large_image', title: `${title} | Astrois`, description, images: ['/opengraph-image'] },
  };
}
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Astrois', url: siteUrl, logo: `${siteUrl}/favicon.svg` },
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'Astrois', alternateName: 'astroais.app', url: siteUrl, inLanguage: 'en', publisher: { '@id': `${siteUrl}/#organization` } },
    { '@type': 'WebApplication', '@id': `${siteUrl}/#app`, name: 'Astrois', url: siteUrl, description: siteDescription, applicationCategory: 'LifestyleApplication', operatingSystem: 'Web browser', browserRequirements: 'Requires JavaScript and an internet connection', publisher: { '@id': `${siteUrl}/#organization` }, featureList: ['Personal birth charts and downloadable kundli', 'Multilingual astrology chat', 'Free daily advice and goals', 'Calculated astrology fallback when AI is unavailable'], offers: [
      { '@type': 'Offer', name: '5-minute chat pass', price: '5', priceCurrency: 'INR', url: `${siteUrl}/#pricing` },
      { '@type': 'Offer', name: '1-day Premium pass', price: '199', priceCurrency: 'INR', url: `${siteUrl}/#pricing` },
      { '@type': 'Offer', name: '30-day Premium pass', price: '1999', priceCurrency: 'INR', url: `${siteUrl}/#pricing` },
    ] },
  ],
};
