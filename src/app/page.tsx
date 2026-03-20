import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { createPageMetadata, siteDescription } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "BSSM Developers",
  description: siteDescription,
  pathname: "/",
});

export default function HomePage() {
  return <HomePageClient />;
}
