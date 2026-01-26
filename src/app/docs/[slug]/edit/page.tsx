/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { ApiDocModule } from "@/components/docs/ApiDocModule";
import { DocsBlock } from "@/types/docs";
import { docsSubData, DocsSubEntry } from "../../mock/docsSubData";
import { apiMockData } from "../../mock/apiMockData";
import { docsApi } from "@/app/docs/api";
import { useDocsStore, DocsStoreState } from "@/store/docsStore";
import { useParams } from "next/navigation";

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

export default function DocsEditPage() {
  const params = useParams();
  const slug = params.slug as string;

  // HMR 업데이트 트리거
  const selected = useDocsStore((s: DocsStoreState) => s.selected);
  const setSelected = useDocsStore((s: DocsStoreState) => s.setSelected);
  const docsData = useDocsStore((s: DocsStoreState) => s.docsData);
  const apiData = useDocsStore((s: DocsStoreState) => s.apiData);
  const updateDocsData = useDocsStore((s: DocsStoreState) => s.updateDocsData);
  const updateApiData = useDocsStore((s: DocsStoreState) => s.updateApiData);

  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);

  // 사이드바 가져오기는 layout.tsx에서 처리되므로 제거됨
  // 제목 정보는 getDetail에 의존

  // 문서 내용 가져오기
  useEffect(() => {
    const fetchDocContent = async () => {
      if (!slug) return;
      try {
        // 상세 정보 가져오기 시도
        // 참고: docsApi.getDetail(slug)는 문서 객체를 직접 반환하거나 data로 감싸서 반환할 수 있음
        const response: any = await docsApi.getDetail(slug);
        console.log("Doc Detail Response:", response);

        const doc = response.data || response;

        if (doc && doc.title) {
          setDocTitle(doc.title);
        }

        if (doc && doc.contents) {
          // 가져온 블록으로 스토어 업데이트
          // 블록에 ID가 없으면 생성
          const blocksWithIds = doc.contents.map((b: any) => ({
            ...b,
            id: b.id || Math.random().toString(36).substring(2, 11)
          }));
          updateDocsData(slug, blocksWithIds);
        } else if (doc) {
          // 문서는 존재하지만 내용이 없음, 플레이스홀더를 표시하기 위해 빈 배열 설정
          updateDocsData(slug, []);
        }
      } catch (e) {
        console.error("Failed to fetch doc content:", e);
        // 실패한 경우, 새 문서이거나 오류일 수 있음
        // 스토어에 데이터가 없으면 플레이스홀더 표시 (또는 오류 상태)
        if (!docsData[slug]) {
          updateDocsData(slug, []);
        }
      }
    };
    fetchDocContent();
  }, [slug, updateDocsData]);

  const [docTitle, setDocTitle] = useState("문서 로딩 중...");

  // 사이드바에서 선택된 노드 찾기
  // const result = findSidebarNodeWithPath(sidebarItems, selected);
  // const node = result?.node;
  // const isApiDoc = node?.module === "api";
  // 현재는 API 정보를 가져오지 않는 한 표준 문서로 가정
  const isApiDoc = false; // TODO: 가능하면 getDetail 응답에서 이를 결정

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
    if (isApiDoc) return; // 현재로서는 API 명세에 블록 추가 안 함

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
      // 블록을 삭제하는 대신 마지막 블록 초기화
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



  const title = docTitle;
  const breadcrumb = ["문서 목록", docTitle];



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
