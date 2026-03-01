"use client";

import { DocsLayout } from "@/components/layout/DocsLayout";
import { SidebarNode } from "@/components/ui/sidebarItem/types";

const USER_SIDEBAR_ITEMS: SidebarNode[] = [
  {
    id: "manage",
    label: "관리하기",
    module: "main_title",
    childrenItems: [
      { id: "my-docs", label: "내 문서", module: "default", path: "/user" },
      { id: "tokens", label: "내 토큰 관리", module: "default", path: "/user/tokens" },
    ],
  },
  {
    id: "account",
    label: "계정 정보",
    module: "main_title",
    childrenItems: [
      { id: "profile", label: "사용자 정보", module: "default", path: "/user/profile" },
    ],
  },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      sidebarItems={USER_SIDEBAR_ITEMS}
      projectName="마이페이지"
      showSidebar={true}
      editable={false}
    >
      {children}
    </DocsLayout>
  );
}
