import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: "Astrois — Your Personal Astrology Guide",
  description: "Your personal space for astrology, love, purpose and self-discovery. Begin with two minutes free.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
