import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, siteDescription, websiteSchema } from '@/lib/seo';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Astrois — AI Astrology, Birth Charts & Daily Guidance", template: "%s | Astrois" },
  description: siteDescription,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: { title: "Astrois — Your Personal Astrology Guide", description: siteDescription, url: '/', siteName: 'Astrois', locale: 'en_IN', type: 'website', images: [{url:'/opengraph-image',width:1200,height:630,alt:'Astrois — Personal astrology, birth charts and daily guidance'}] },
  twitter: { card: 'summary_large_image', title: "Astrois — Your Personal Astrology Guide", description: siteDescription, images: ['/opengraph-image'] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c') }}/><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
