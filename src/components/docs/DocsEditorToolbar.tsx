"use client";

import styled from "@emotion/styled";

export function DocsEditorToolbar({ onSave, onAddBlock }: { onSave: () => void; onAddBlock?: () => void }) {
  return (
    <Toolbar>
      {onAddBlock && <button onClick={onAddBlock}>블록 추가</button>}
      <button onClick={onSave}>저장</button>
    </Toolbar>
  );
}

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;

  button {
    background: ${({ theme }) => theme.colors.bssmBlue};
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: 600;
    &:hover {
      opacity: 0.9;
    }
  }
`;