"use client";

import { useEffect, useState } from "react";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { ApiDocModule } from "@/components/docs/ApiDocModule";
import { DocsBlock } from "@/types/docs";
import { docsSubData, DocsSubEntry } from "./mock/docsSubData";
import { apiMockData } from "./mock/apiMockData";
import { useDocsStore } from "@/store/docsStore";

type BlockWithId = DocsBlock & { id: string };

// Helper function to find the sidebar node
const findSidebarNode = (items: any[], id: string): any => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.childrenItems) {
      const found = findSidebarNode(item.childrenItems, id);
      if (found) return found;
    }
  }
  return null;
};

// Need to import sidebar items to check if selected is API
const sidebarItems = [
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

export default function DocsEditPage() {
  const selected = useDocsStore((s: any) => s.selected);
  const [blocks, setBlocks] = useState<BlockWithId[]>(docsSubData[0].blocks as BlockWithId[]);
  const [isApiDoc, setIsApiDoc] = useState(false);
  const [currentApiData, setCurrentApiData] = useState<any>(null);

  useEffect(() => {
    if (selected == null) return;

    // Find the selected node in sidebar
    const node = findSidebarNode(sidebarItems, selected);

    if (node && node.module === "api") {
      // It's an API document
      setIsApiDoc(true);
      setCurrentApiData(apiMockData[selected]);
    } else {
      // It's a regular document
      setIsApiDoc(false);

      if (typeof selected === "number") {
        setBlocks((docsSubData[selected]?.blocks as BlockWithId[]) ?? []);
        return;
      }
      const found: DocsSubEntry | undefined = docsSubData.find(d => d.id === String(selected));
      setBlocks((found?.blocks as BlockWithId[]) ?? []);
    }
  }, [selected]);

  const handleApiDataChange = (updated: any) => {
    setCurrentApiData((prev: any) => ({ ...prev, ...updated }));
    console.log("Updated API Data:", { ...currentApiData, ...updated });
  };

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    const copy = [...blocks];
    copy[index] = { ...copy[index], ...updated } as BlockWithId;
    setBlocks(copy);
    console.log(copy);
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const copy = [...blocks];
    const blockToInsert: BlockWithId = {
      id: crypto.randomUUID(),
      ...(newBlock ?? { module: "docs_1", content: "" }),
    } as BlockWithId;
    copy.splice(index + 1, 0, blockToInsert);
    setBlocks(copy);
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${blockToInsert.id}']`);
      el?.focus();
    }, 0);
    console.log(copy);
  };

  const handleRemoveBlock = (index: number) => {
    if (blocks.length === 0) return;
    const copy = [...blocks];
    const focusTargetId = index > 0 ? copy[index - 1]?.id : copy[index + 1]?.id;
    copy.splice(index, 1);
    setBlocks(copy);
    if (focusTargetId) {
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(`[data-block-id='${focusTargetId}']`);
        el?.focus();
      }, 0);
    }
    console.log(copy);
  };

  const handleFocusMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    const targetId = blocks[target]?.id;
    if (!targetId) return;
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${targetId}']`);
      el?.focus();
    }, 0);
  };

  // Get current page info
  const currentNode = findSidebarNode(sidebarItems, selected);
  const title = currentNode?.label || "시작하기";
  const breadcrumb = currentNode?.module === "api" ? ["API"] : ["가이드"];

  return (
    <DocsLayout>
      {isApiDoc && currentApiData ? (
        <ApiDocModule
          apiId={currentApiData.id}
          apiName={currentApiData.name}
          method={currentApiData.method}
          endpoint={currentApiData.endpoint}
          description={currentApiData.description}
          headerParams={currentApiData.headerParams}
          bodyParams={currentApiData.bodyParams}
          responseParams={currentApiData.responseParams}
          sampleCode={currentApiData.sampleCode}
          responseCode={currentApiData.responseCode}
          editable={true}
          onHeaderParamsChange={(params) => handleApiDataChange({ headerParams: params })}
          onBodyParamsChange={(params) => handleApiDataChange({ bodyParams: params })}
          onResponseParamsChange={(params) => handleApiDataChange({ responseParams: params })}
        />
      ) : (
        <>
          <DocsHeader title={title} breadcrumb={breadcrumb} />

          {blocks.map((block, i) => (
            <DocsBlockEditor
              key={block.id}
              index={i}
              block={block}
              onChange={(idx, updated) => handleBlockChange(idx, updated)}
              onAddBlock={handleAddBlock}
              onRemoveBlock={handleRemoveBlock}
              onFocusMove={handleFocusMove}
            />
          ))}
        </>
      )}
    </DocsLayout>
  );
}
