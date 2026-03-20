import type { Metadata } from "next";
import ApiExplorePageClient from "./ApiExplorePageClient";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "API 둘러보기",
  description: "학생들이 공유한 API 문서를 탐색하고 사용 신청까지 진행할 수 있습니다.",
  pathname: "/apis",
});

export default function ApiExplorePage() {
  return <ApiExplorePageClient />;
}
