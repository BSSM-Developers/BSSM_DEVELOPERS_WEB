import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { RootProvider } from "@/providers/RootProvider";
import { RouteTransitionLoader } from "@/components/common/RouteTransitionLoader";
import { TopNavHydrationSafe } from "@/components/layout/TopNavHydrationSafe";
import { defaultOgImage, siteDescription, siteName, siteUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteName,
    template: "%s | BSSM Developers",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: ["BSSM Developers", "API", "개발 문서", "API 공유", "학생 개발"],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: "/",
    siteName,
    locale: "ko_KR",
    type: "website",
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/bssm-developers.svg",
    shortcut: "/bssm-developers.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning>
        <RootProvider>
          <TopNavHydrationSafe />
          <Suspense fallback={null}>
            <RouteTransitionLoader />
          </Suspense>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
