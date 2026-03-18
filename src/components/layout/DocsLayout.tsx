"use client";

import styled from "@emotion/styled";
import { DocsSidebar, type SidebarModuleOption } from "./DocsSidebar";
import { useEffect, useState } from "react";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";

const testItems: SidebarNode[] = [
  { id: "perseus", label: "페르세우스", module: "main" },
  { id: "doc-1", label: "시작하기", module: "default" },
  { id: "api-description", label: "API 설명", module: "default" },
  { id: "api-spec", label: "API 명세서", module: "collapse", childrenItems: [] },
  {
    id: "user",
    label: "user",
    module: "collapse",
    childrenItems: [
      { id: "user-add", label: "추가 정보 입력", module: "api", method: "POST" },
      { id: "user-profile", label: "프로필 조회", module: "api", method: "GET" }
    ]
  },
  {
    id: "auth",
    label: "auth",
    module: "collapse",
    childrenItems: [
      { id: "google-login", label: "구글 로그인", module: "api", method: "POST" },
      { id: "google-url", label: "구글 로그인 url 조회", module: "api", method: "GET" },
      { id: "token-refresh", label: "토큰 재발급", module: "api", method: "GET" },
      { id: "logout", label: "로그아웃", module: "api", method: "GET" }
    ]
  },
  {
    id: "sign-up",
    label: "sign up",
    module: "collapse",
    childrenItems: [
      { id: "sign-up-my", label: "나의 회원가입 신청 조회", module: "api", method: "GET" },
      { id: "sign-up-list", label: "회원가입 신청 조회 by 커서 기반 페이지네이션", module: "api", method: "GET" },
      { id: "sign-up-update", label: "회원가입 신청 목적 업데이트", module: "api", method: "PATCH" },
      { id: "sign-up-approve", label: "어드민 - 회원가입 신청 승인", module: "api", method: "PATCH" },
      { id: "sign-up-reject", label: "어드민 - 회원가입 신청 거절", module: "api", method: "PATCH" }
    ]
  },
  {
    id: "fact",
    label: "fact",
    module: "collapse",
    childrenItems: [
      { id: "fact-create", label: "사실 작성", module: "api", method: "POST" },
      { id: "fact-delete", label: "사실 제거", module: "api", method: "DELETE" }
    ]
  },
  {
    id: "fact-update",
    label: "fact update",
    module: "collapse",
    childrenItems: [
      { id: "fact-update-create", label: "인지 왜곡 수정 글 작성", module: "api", method: "POST" },
      { id: "fact-update-view", label: "인지 왜곡 수정 글 조회", module: "api", method: "GET" }
    ]
  }
];

export function DocsLayout({
  children,
  sidebarItems,
  showSidebar = true,
  onSidebarChange,
  projectName,
  editable = false,
  sidebarModuleOptions,
  onRequestAddApi,
  disableApiRename = false,
}: {
  children: React.ReactNode;
  sidebarItems?: SidebarNode[];
  showSidebar?: boolean;
  onSidebarChange?: (items: SidebarNode[]) => void;
  projectName?: string;
  editable?: boolean;
  sidebarModuleOptions?: SidebarModuleOption[];
  onRequestAddApi?: (intent: { mode: "sibling" | "child"; targetId: string | null }) => void;
  disableApiRename?: boolean;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [renamingProjectName, setRenamingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState(projectName ?? "");

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const items = sidebarItems || testItems;
  const canRenameProjectName = editable && Boolean(onSidebarChange) && items.length > 0;

  useEffect(() => {
    setProjectNameInput(projectName ?? "");
  }, [projectName]);

  const commitProjectName = () => {
    if (!canRenameProjectName || !onSidebarChange || !sidebarItems) {
      setRenamingProjectName(false);
      return;
    }
    const nextTitle = projectNameInput.trim();
    if (!nextTitle) {
      setProjectNameInput(projectName ?? "");
      setRenamingProjectName(false);
      return;
    }

    const rootIndex = sidebarItems.findIndex((item) => item.module === "main_title");
    const nextItems = [...sidebarItems];
    if (rootIndex >= 0) {
      nextItems[rootIndex] = { ...nextItems[rootIndex], label: nextTitle };
    } else if (nextItems.length > 0) {
      nextItems[0] = { ...nextItems[0], label: nextTitle };
    }
    onSidebarChange(nextItems);
    setRenamingProjectName(false);
  };

  return (
    <Wrapper>
      <Body>
        {showSidebar && (
          <Sidebar collapsed={sidebarCollapsed}>
            <SidebarHeader collapsed={sidebarCollapsed}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
                {!sidebarCollapsed && projectName && (
                  renamingProjectName ? (
                    <ProjectNameInput
                      value={projectNameInput}
                      onChange={(event) => setProjectNameInput(event.target.value)}
                      onBlur={commitProjectName}
                      onKeyDown={(event) => {
                        if (event.nativeEvent.isComposing || event.keyCode === 229) {
                          return;
                        }
                        if (event.key === "Enter") {
                          commitProjectName();
                        }
                        if (event.key === "Escape") {
                          setProjectNameInput(projectName ?? "");
                          setRenamingProjectName(false);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <ProjectName
                      role={canRenameProjectName ? "button" : undefined}
                      onDoubleClick={() => {
                        if (canRenameProjectName) {
                          setRenamingProjectName(true);
                        }
                      }}
                    >
                      {projectName}
                    </ProjectName>
                  )
                )}
                <ToggleButton onClick={toggleSidebar}>
                  {sidebarCollapsed ? "→" : "←"}
                </ToggleButton>
              </div>
            </SidebarHeader>
            {!sidebarCollapsed && (
              <DocsSidebar
                items={items}
                editable={editable}
                onChange={onSidebarChange}
                moduleOptions={sidebarModuleOptions}
                onRequestAddApi={onRequestAddApi}
                disableApiRename={disableApiRename}
              />
            )}
          </Sidebar>
        )}
        <Content>
          {children}
        </Content>
      </Body>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 69px);
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.aside<{ collapsed: boolean }>`
  width: ${({ collapsed }) => collapsed ? "48px" : "260px"};
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.grey[200]};
  overflow-y: auto;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div<{ collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ collapsed }) => collapsed ? "center" : "flex-end"};
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[200]};
`;

const ToggleButton = styled.button`
  width: 24px;
  height: 24px;
  border: 0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.grey[600]};

  &:hover {
    background: ${({ theme }) => theme.colors.grey[100]};
  }
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  cursor: text;
`;

const ProjectName = styled.span`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.grey[700]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProjectNameInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 6px;
  padding: 0 8px;
  background: white;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.grey[700]};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
  }
`;
