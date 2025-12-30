import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/providers/RootProvider";

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
};

import { TopNav } from "@/components/layout/TopNav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <RootProvider>
          <TopNav />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
