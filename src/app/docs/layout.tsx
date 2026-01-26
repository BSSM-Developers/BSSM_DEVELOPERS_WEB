import { useDocsListQuery } from "@/app/docs/queries";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarNode } from "@/components/ui/sidebarItem/types";
import { DocsLayout } from "@/components/layout/DocsLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: docsData } = useDocsListQuery();
  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);
  const pathname = usePathname();
  const isRegisterPage = pathname === "/docs/register";

  useEffect(() => {
    if (docsData) {
      // Assuming docsData is array or { values: [] }
      const list = (docsData as any).values || (Array.isArray(docsData) ? docsData : []);

      const items = list.map((doc: any) => ({
        id: doc.docsId || doc.id,
        label: doc.title,
        module: "default",
        childrenItems: []
      }));

      setSidebarItems([{
        id: "root",
        label: "문서 목록",
        module: "main",
        childrenItems: items
      }]);
    }
  }, [docsData]);

  if (isRegisterPage) {
    return <>{children}</>;
  }

  return (
    <DocsLayout sidebarItems={sidebarItems} showSidebar={true}>
      {children}
    </DocsLayout>
  );
}
