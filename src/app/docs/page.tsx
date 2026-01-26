"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlock } from "@/types/docs";
import { useDocsStore, DocsStoreState } from "@/store/docsStore";

type BlockWithId = DocsBlock & { id: string };

import type { SidebarNode } from "@/components/ui/sidebarItem/types";

// 사이드바 노드와 경로를 찾는 헬퍼 함수
const findSidebarNodeWithPath = (items: SidebarNode[], id: string, path: string[] = []): { node: SidebarNode; path: string[] } | null => {
  for (const item of items) {
    if (item.id === id) return { node: item, path };
    if (item.childrenItems) {
      const found = findSidebarNodeWithPath(item.childrenItems, id, [...path, item.label]);
      if (found) return found;
    }
  }
  return null;
};

// API 여부를 확인하기 위해 사이드바 아이템 필요
const sidebarItems: SidebarNode[] = [
  {
    id: "perseus",
    label: "페르세우스",
    module: "main",
    childrenItems: [
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
        id: "docs-api",
        label: "docs",
        module: "collapse",
        childrenItems: [
          { id: "docs-create", label: "문서 생성", module: "api", method: "POST" },
          { id: "docs-view", label: "문서 조회", module: "api", method: "GET" }
        ]
      },
      {
        id: "api-token",
        label: "api token",
        module: "collapse",
        childrenItems: [
          { id: "token-create", label: "토큰 생성", module: "api", method: "POST" },
          { id: "token-usage", label: "사용량 조회", module: "api", method: "GET" }
        ]
      },
      {
        id: "system",
        label: "system",
        module: "collapse",
        childrenItems: [
          { id: "health-check", label: "Health Check", module: "api", method: "GET" },
          { id: "server-usage", label: "서버 사용량", module: "api", method: "GET" }
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
    ]
  }
];

export default function DocsEditPage() {
  console.log("Sidebar Items:", sidebarItems);
  // Trigger HMR update
  const selected = useDocsStore((s: DocsStoreState) => s.selected);
  const docsData = useDocsStore((s: DocsStoreState) => s.docsData);
  const apiData = useDocsStore((s: DocsStoreState) => s.apiData);
  const updateDocsData = useDocsStore((s: DocsStoreState) => s.updateDocsData);
  const updateApiData = useDocsStore((s: DocsStoreState) => s.updateApiData);

  // 사이드바에서 선택된 노드 찾기
  const result = findSidebarNodeWithPath(sidebarItems, selected);
  const node = result?.node;
  const isApiDoc = node?.module === "api";

  const blocks = isApiDoc
    ? (apiData[selected] ? [{ id: 'api-spec-block', module: 'api', apiData: apiData[selected] }] : [])
    : (docsData[selected] || []);

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    if (isApiDoc && updated.apiData) {
      updateApiData(selected, updated.apiData);
    } else if (!isApiDoc) {
      const copy = [...(docsData[selected] || [])];
      copy[index] = { ...copy[index], ...updated } as BlockWithId;
      updateDocsData(selected, copy);
    }
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    if (isApiDoc) return; // Don't add blocks to API spec for now

    const copy = [...(docsData[selected] || [])];
    const blockId = Math.random().toString(36).substring(2, 11);
    const blockToInsert: BlockWithId = {
      id: blockId,
      ...(newBlock ?? { module: "docs_1", content: "" }),
    } as BlockWithId;

    copy.splice(index + 1, 0, blockToInsert);
    updateDocsData(selected, copy);

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${blockId}']`);
      el?.focus();
    }, 0);
  };

  const handleRemoveBlock = (index: number) => {
    if (isApiDoc) return;

    const copy = [...(docsData[selected] || [])];
    if (copy.length <= 1) {
      // Reset the last block instead of deleting it
      copy[0] = { ...copy[0], module: "docs_1", content: "" };
      updateDocsData(selected, copy);
      return;
    }

    const focusTargetId = index > 0 ? copy[index - 1]?.id : copy[index + 1]?.id;
    copy.splice(index, 1);
    updateDocsData(selected, copy);

    if (focusTargetId) {
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(`[data-block-id='${focusTargetId}']`);
        el?.focus();
      }, 0);
    }
  };

  const handleFocusMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    const targetId = (blocks[target] as BlockWithId)?.id;
    if (!targetId) return;
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${targetId}']`);
      el?.focus();
    }, 0);
  };

  const title = node?.label || "시작하기";
  const breadcrumb = result?.path || ["가이드"];



  return (
    <>
      <DocsHeader title={title} breadcrumb={breadcrumb} isApi={isApiDoc} />

      <div
        style={{ minHeight: "500px" }}
        onClick={() => {
          if (blocks.length === 0 && !isApiDoc) {
            const blockId = Math.random().toString(36).substring(2, 11);
            updateDocsData(selected, [{ id: blockId, module: "docs_1", content: "" }]);
          }
        }}
      >
        {blocks.length === 0 && !isApiDoc ? (
          <div style={{ padding: "20px 0", color: "#9CA3AF", cursor: "text" }}>
            내용을 입력하려면 클릭하세요...
          </div>
        ) : (
          (blocks as BlockWithId[]).map((block, i: number) => (
            <DocsBlockEditor
              key={block.id || i}
              index={i}
              block={block}
              onChange={(idx, updated) => handleBlockChange(idx, updated)}
              onAddBlock={handleAddBlock}
              onRemoveBlock={handleRemoveBlock}
              onFocusMove={handleFocusMove}
            />
          ))
        )}
      </div>
    </>
  );
}
