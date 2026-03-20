import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadGuideSummaries } from "./data";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "가이드",
  description: "BSSM Developers 사용 가이드를 확인할 수 있습니다.",
  pathname: "/guide",
});

export default async function GuidePage() {
  const guides = await loadGuideSummaries();

  if (guides.length === 0) {
    return null;
  }

  redirect(`/guide/${guides[0].slug}`);
}
