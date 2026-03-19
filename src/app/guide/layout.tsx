import { DocsLayout } from "@/components/layout/DocsLayout";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { loadGuideSummaries } from "./data";

interface GuideLayoutProps {
  children: React.ReactNode;
}

const toSidebarItems = (items: Awaited<ReturnType<typeof loadGuideSummaries>>): SidebarNode[] =>
  items.map((guide) => ({
    id: `guide-${guide.slug}`,
    label: guide.title,
    module: "default",
    path: `/guide/${guide.slug}`,
  }));

export default async function GuideLayout({ children }: GuideLayoutProps) {
  const guides = await loadGuideSummaries();

  return (
    <DocsLayout
      showSidebar={true}
      sidebarItems={toSidebarItems(guides)}
      projectName="가이드"
      sidebarResizable={true}
      sidebarDefaultWidth={340}
      sidebarMinWidth={280}
      sidebarMaxWidth={560}
    >
      {children}
    </DocsLayout>
  );
}
