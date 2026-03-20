import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadNoticeSummaries } from "./data";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "공지사항",
  description: "BSSM Developers의 최신 공지사항과 업데이트 소식을 확인할 수 있습니다.",
  pathname: "/announcements",
});

export default async function AnnouncementsPage() {
  const notices = await loadNoticeSummaries();

  if (notices.length === 0) {
    return null;
  }

  redirect(`/announcements/${notices[0].slug}`);
}
