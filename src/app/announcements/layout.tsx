import { DocsLayout } from "@/components/layout/DocsLayout";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { loadNoticeSummaries } from "./data";
import { unstable_noStore as noStore } from "next/cache";

interface AnnouncementsLayoutProps {
  children: React.ReactNode;
}

const toSidebarItems = (items: Awaited<ReturnType<typeof loadNoticeSummaries>>): SidebarNode[] => {
  const noticeItems: SidebarNode[] = items.map((notice) => ({
    id: `announcement-${notice.slug}`,
    label: notice.title,
    module: "default",
    path: `/announcements/${notice.slug}`,
  }));

  return noticeItems;
};

export default async function AnnouncementsLayout({ children }: AnnouncementsLayoutProps) {
  noStore();
  const notices = await loadNoticeSummaries();

  return (
    <DocsLayout
      showSidebar={true}
      sidebarItems={toSidebarItems(notices)}
      projectName="공지사항"
      sidebarResizable={true}
      sidebarDefaultWidth={340}
      sidebarMinWidth={280}
      sidebarMaxWidth={560}
    >
      {children}
    </DocsLayout>
  );
}
