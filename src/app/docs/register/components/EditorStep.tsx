import React from 'react';
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { PrevButton, NextButton } from '../styles';
import { Step } from '../hooks/types';
import { useDocsStore } from "@/store/docsStore";
import { findNodeById } from "@/components/layout/treeUtils";

interface EditorStepProps {
  formData: { title: string };
  sidebarItems: SidebarNode[];
  setSidebarItems: (items: SidebarNode[]) => void;
  docsBlocks: DocsBlock[];
  handleBlockChange: (index: number, updated: DocsBlock) => void;
  handleAddBlock: (index: number, newBlock?: DocsBlock) => void;
  handleRemoveBlock: (index: number) => void;
  handleFocusMove: (index: number, direction: "up" | "down") => void;
  handleStepChange: (step: Step) => void;
  handleNext: () => void;
}

export const EditorStep = ({
  formData,
  sidebarItems,
  setSidebarItems,
  docsBlocks,
  handleBlockChange,
  handleAddBlock,
  handleRemoveBlock,
  handleFocusMove,
  handleStepChange,
  handleNext
}: EditorStepProps) => {
  const currentId = useDocsStore((state) => state.selected);
  const selectedNode = currentId ? findNodeById(sidebarItems, currentId) : null;
  const isRoot = selectedNode?.id === sidebarItems[0]?.id;

  const breadcrumb = isRoot ? [] : [formData.title || "새 문서"];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 100, background: 'white' }}>
      <DocsLayout
        showSidebar={true}
        sidebarItems={sidebarItems}
        onSidebarChange={setSidebarItems}
      >
        <DocsHeader title={selectedNode?.label || formData.title || "새 문서"} breadcrumb={breadcrumb} isApi={false} />
        <div style={{ minHeight: "500px" }} onClick={() => {
          if (docsBlocks.length === 0) {
            handleAddBlock(-1);
          }
        }}>
          {docsBlocks.length === 0 ? (
            <div style={{ padding: "20px 0", color: "#9CA3AF", cursor: "text" }}>
              내용을 입력하려면 클릭하세요...
            </div>
          ) : (
            docsBlocks.map((block, i) => (
              <DocsBlockEditor
                key={block.id || i}
                index={i}
                block={block}
                onChange={handleBlockChange}
                onAddBlock={handleAddBlock}
                onRemoveBlock={handleRemoveBlock}
                onFocusMove={handleFocusMove}
              />
            ))
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
          <NextButton onClick={handleNext}>다음으로</NextButton>
        </div>
      </DocsLayout>
    </div>
  );
};
