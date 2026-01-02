"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styled from "@emotion/styled";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlock } from "@/types/docs";
import { ArrowLeft, Save } from "lucide-react";

export default function DocsEditPage() {
  const router = useRouter();
  const params = useParams();
  const docsId = params.docsId;

  const [blocks, setBlocks] = useState<DocsBlock[]>([
    { id: "1", module: "headline_1", content: "API 문서 제목" },
    { id: "2", module: "docs_1", content: "여기에 API 설명을 작성하세요." },
  ]);
  const [loading, setLoading] = useState(false);

  const handleBlockChange = (index: number, updatedBlock: DocsBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const newBlocks = [...blocks];
    const blockToAdd = newBlock || { id: Math.random().toString(36).substring(2, 9), module: "docs_1", content: "" };
    newBlocks.splice(index + 1, 0, blockToAdd);
    setBlocks(newBlocks);
  };

  const handleRemoveBlock = (index: number) => {
    if (blocks.length <= 1) return;
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    setLoading(true);
    // MOCKING: Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    alert("문서가 성공적으로 등록되었습니다!");
    router.push(`/docs/${docsId}`);
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => router.back()}>
          <ArrowLeft size={20} />
          뒤로가기
        </BackButton>
        <Title>문서 수정 모드</Title>
        <SaveButton onClick={handleSave} disabled={loading}>
          <Save size={18} />
          {loading ? "저장 중..." : "최종 등록"}
        </SaveButton>
      </Header>

      <EditorContainer>
        {blocks.map((block, index) => (
          <DocsBlockEditor
            key={block.id || index}
            block={block}
            index={index}
            onChange={handleBlockChange}
            onAddBlock={handleAddBlock}
            onRemoveBlock={handleRemoveBlock}
          />
        ))}
      </EditorContainer>
    </Container>
  );
}

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E5E7EB;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
`;

const BackButton = styled(Button)`
  background: white;
  border: 1px solid #E5E7EB;
  color: #374151;
  &:hover {
    background: #F9FAFB;
  }
`;

const SaveButton = styled(Button)`
  background: #16335C;
  border: 1px solid #16335C;
  color: white;
  &:hover {
    background: #1a3a68;
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;
