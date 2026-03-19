import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { RootProvider } from "@/providers/RootProvider";
import { RouteTransitionLoader } from "@/components/common/RouteTransitionLoader";
import { TopNavHydrationSafe } from "@/components/layout/TopNavHydrationSafe";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BSSM Developers",
  description: "API 공유 플랫폼",
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
