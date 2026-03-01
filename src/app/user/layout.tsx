"use client";

import { DocsLayout } from "@/components/layout/DocsLayout";
import { SidebarNode } from "@/components/ui/sidebarItem/types";
import { useUserQuery } from "@/app/user/queries";
import { useMemo } from "react";

const BASE_USER_SIDEBAR_ITEMS: SidebarNode[] = [
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
  {
    id: "api-management",
    label: "내 API 관리",
    module: "main_title",
    childrenItems: [
      { id: "api-request-management", label: "사용 신청 관리", module: "default", path: "/user/api-management" },
    ],
  },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useUserQuery();

  const sidebarItems = useMemo<SidebarNode[]>(() => {
    const items = [...BASE_USER_SIDEBAR_ITEMS];
    if (user?.role === "ADMIN" || user?.role === "ROLE_ADMIN") {
      items.push({
        id: "signup-management",
        label: "회원가입 신청",
        module: "main_title",
        childrenItems: [
          { id: "signup-request-management", label: "회원가입 신청 관리", module: "default", path: "/user/sign-up-requests" },
        ],
      });
      items.push({
        id: "admin-api-use-management",
        label: "어드민 API 관리",
        module: "main_title",
        childrenItems: [
          { id: "admin-api-use-reasons", label: "전체 사용 신청 관리", module: "default", path: "/user/api-use-reasons" },
        ],
      });
    }
    return items;
  }, [user?.role]);

  return (
    <DocsLayout
      sidebarItems={sidebarItems}
      projectName="마이페이지"
      showSidebar={true}
      editable={false}
    >
      {children}
    </DocsLayout>
  );
}
