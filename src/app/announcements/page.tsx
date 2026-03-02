import { redirect } from "next/navigation";
import { loadNoticeSummaries } from "./data";

export default async function AnnouncementsPage() {
  const notices = await loadNoticeSummaries();

  if (notices.length === 0) {
    return null;
  }

  redirect(`/announcements/${notices[0].slug}`);
}
