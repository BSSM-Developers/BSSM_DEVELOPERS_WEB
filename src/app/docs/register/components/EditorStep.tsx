import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { PrevButton, NextButton } from '../styles';
import { Step } from '../hooks/types';
import { useDocsStore } from "@/store/docsStore";
import { findNodeById, findNodePathById } from "@/components/layout/treeUtils";
import { insertAfter, appendChild } from "@/components/layout/sidebarUtils";
import { flattenSidebarNodes } from '../hooks/contentMapUtils';
import { FormData } from '../hooks/useDocsForm';
import type { GitHubParsedEndpoint } from "@/app/user/github/api";
import { EndpointPickerModal } from "./EndpointPickerModal";

interface EditorStepProps {
  formData: FormData;
  sidebarItems: SidebarNode[];
  setSidebarItems: (items: SidebarNode[]) => void;
  docsBlocks: DocsBlock[];
  handleBlockChange: (index: number, updated: DocsBlock) => void;
  handleAddBlock: (index: number, newBlock?: DocsBlock) => void;
  handleDuplicateBlock: (index: number) => void;
  handleRemoveBlock: (index: number) => void;
  handleFocusMove: (index: number, direction: "up" | "down") => void;
  handleMoveBlock: (activeId: string, overId: string) => void;
  handleStepChange: (step: Step) => void;
  handleNext: () => void;
  /** 레포에서 파싱된 엔드포인트 (API 추가 시 선택용) */
  parsedEndpoints?: GitHubParsedEndpoint[];
}

const epKey = (e: { method: string; endpoint: string }) =>
  `${e.method.toUpperCase()} ${e.endpoint}`;

export const EditorStep = ({
  formData,
  sidebarItems,
  setSidebarItems,
  docsBlocks,
  handleBlockChange,
  handleAddBlock,
  handleDuplicateBlock,
  handleRemoveBlock,
  handleFocusMove,
  handleMoveBlock,
  handleStepChange,
  handleNext,
  parsedEndpoints = [],
}: EditorStepProps) => {
  const currentId = useDocsStore((state) => state.selected);
  const setSelected = useDocsStore((state) => state.setSelected);

  // API 추가 모달 상태 (사이드바 "API 추가" 클릭 시 열림)
  const [apiPicker, setApiPicker] = useState<
    { mode: "sibling" | "child"; targetId: string | null } | null
  >(null);

  // 이미 추가된 엔드포인트 키 집합 (중복 방지)
  const usedEndpointKeys = new Set(
    flattenSidebarNodes(sidebarItems)
      .filter((n) => n.module === "api" && n.endpoint)
      .map((n) => epKey({ method: n.method || "GET", endpoint: n.endpoint! }))
  );

  // API 노드를 sidebarItems에 추가 (선택된 엔드포인트 or 커스텀)
  const addApiNode = (ep?: GitHubParsedEndpoint) => {
    const node: Omit<SidebarNode, "id"> = ep
      ? {
          label: ep.endpoint,
          module: "api",
          method: (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(ep.method.toUpperCase())
            ? ep.method.toUpperCase()
            : "GET") as SidebarNode["method"],
          endpoint: ep.endpoint,
          childrenItems: [],
        }
      : { label: "새 API", module: "api", method: "GET", childrenItems: [] };

    const intent = apiPicker;
    let nextItems: SidebarNode[];
    let newId = "";
    // insertAfter/appendChild는 id를 내부 생성하므로, 추가 후 마지막 api 노드를 찾아 선택
    if (intent?.mode === "child" && intent.targetId) {
      nextItems = appendChild(sidebarItems, intent.targetId, node);
    } else {
      const baseId =
        intent?.targetId ?? sidebarItems[sidebarItems.length - 1]?.id ?? "";
      nextItems = baseId ? insertAfter(sidebarItems, baseId, node) : [...sidebarItems];
    }
    // 새로 생긴 노드 찾기 (라벨+endpoint 일치, 기존에 없던 id)
    const prevIds = new Set(flattenSidebarNodes(sidebarItems).map((n) => n.id));
    const created = flattenSidebarNodes(nextItems).find(
      (n) => !prevIds.has(n.id) && n.module === "api"
    );
    newId = created?.id ?? "";
    setSidebarItems(nextItems);
    if (newId) setSelected(newId);
    setApiPicker(null);
  };
  const selectedNode = currentId ? findNodeById(sidebarItems, currentId) : null;
  const selectedPathLabels = currentId
    ? (findNodePathById(sidebarItems, currentId)?.map((node) => node.label).filter((label) => Boolean(label)) ?? [])
    : [];
  const resolvedTitle = selectedPathLabels[selectedPathLabels.length - 1] || selectedNode?.label || formData.title || "새 문서";
  const breadcrumb = selectedPathLabels.length > 1 ? selectedPathLabels.slice(0, -1) : [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      handleMoveBlock(active.id as string, over.id as string);
    }
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 69px)', display: 'flex', flexDirection: 'column' }}>
      <DocsLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        onSidebarChange={setSidebarItems}
        projectName={formData.title || "새 문서"}
        editable={true}
        onRequestAddApi={(intent) => {
          // 추가 가능한 파싱 엔드포인트가 있으면 모달, 없으면 바로 커스텀 노드
          const hasAvailable = parsedEndpoints.some(
            (ep) => !usedEndpointKeys.has(epKey(ep))
          );
          if (hasAvailable) {
            setApiPicker(intent);
          } else {
            setApiPicker(intent);
            // 모달 없이 바로 커스텀이 더 자연스럽지만, intent 보존 위해 모달 경유.
            // 후보 0건이면 모달이 "직접 입력으로 추가"만 노출.
          }
        }}
      >
        <DocsHeader title={resolvedTitle} breadcrumb={breadcrumb} isApi={false} />
        <div
          data-tour="docs-content"
          style={{
            minHeight: "500px",
            flex: 1,
            cursor: "text",
            display: "flex",
            flexDirection: "column",
            paddingLeft: '36px',
            position: 'relative'
          }}
          onClick={() => {
            if (docsBlocks.length > 0) {
              const lastBlock = docsBlocks[docsBlocks.length - 1];
              if ((lastBlock.module === "docs_1" || lastBlock.module === "list" || lastBlock.module === "headline_1" || lastBlock.module === "headline_2") && lastBlock.content === "") {
                const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-block-id='${lastBlock.id}']`);
                el?.focus();
                return;
              }
            }
            if (docsBlocks.length === 0) {
              handleAddBlock(-1);
            } else {
              handleAddBlock(docsBlocks.length);
            }
          }}
        >
          {docsBlocks.length === 0 ? (
            <div style={{ padding: "20px 0", color: "#9CA3AF" }}>
              내용을 입력하려면 클릭하세요...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={docsBlocks.map(b => b.id as string)}
                strategy={verticalListSortingStrategy}
              >
                {docsBlocks.map((block, i) => (
                  <DocsBlockEditor
                    key={block.id}
                    index={i}
                    block={block}
                    domain={formData.domain || ""}
                    onChange={handleBlockChange}
                    onAddBlock={handleAddBlock}
                    onDuplicateBlock={handleDuplicateBlock}
                    onRemoveBlock={handleRemoveBlock}
                    onFocusMove={handleFocusMove}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '40px',
          display: 'flex',
          gap: '10px',
          zIndex: 1000
        }}>
          <PrevButton onClick={() => handleStepChange('INPUT')} style={{ background: 'white', border: '1px solid #E5E7EB' }}>이전으로</PrevButton>
          <NextButton data-tour="docs-next" onClick={handleNext}>다음으로</NextButton>
        </div>
      </DocsLayout>

      {apiPicker && (
        <EndpointPickerModal
          endpoints={parsedEndpoints}
          usedKeys={usedEndpointKeys}
          onPick={(ep) => addApiNode(ep)}
          onCustom={() => addApiNode()}
          onClose={() => setApiPicker(null)}
        />
      )}
    </div>
  );
};
