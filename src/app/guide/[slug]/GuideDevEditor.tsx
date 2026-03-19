"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";
import { useConfirm } from "@/hooks/useConfirm";
import type { DocsBlock } from "@/types/docs";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { FloatingInput } from "@/components/ui/FloatingInput";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface GuideDevEditorProps {
  slug?: string;
  initialTitle: string;
  initialBlocks: DocsBlock[];
  mode?: "edit" | "create";
}

type EditorBlock = DocsBlock & { id: string };

const createBlockId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const toEditorBlocks = (blocks: DocsBlock[]): EditorBlock[] => {
  const mapped = blocks.map((block) => ({
    ...block,
    id: String(block.id ?? createBlockId()),
  }));
  return mapped.length > 0 ? mapped : [{ id: createBlockId(), module: "docs_1", content: "" }];
};

const toStableSignature = (value: unknown): string => JSON.stringify(value);

const resolveErrorMessage = async (response: Response): Promise<string> => {
  const fallback = "가이드 저장에 실패했습니다.";
  const raw = await response.text();
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message;
    }
  } catch {
  }
  return fallback;
};

export function GuideDevEditor({ slug, initialTitle, initialBlocks, mode = "edit" }: GuideDevEditorProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => toEditorBlocks(initialBlocks));
  const [isSaving, setIsSaving] = useState(false);

  const initialSignature = useMemo(
    () => toStableSignature({ title: initialTitle.trim(), blocks: toEditorBlocks(initialBlocks) }),
    [initialBlocks, initialTitle]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBlockChange = useCallback((index: number, updated: DocsBlock) => {
    setBlocks((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) {
        return prev;
      }
      next[index] = { ...current, ...updated, id: current.id };
      return next;
    });
  }, []);

  const handleAddBlock = useCallback((index: number, newBlock?: DocsBlock) => {
    const blockId = createBlockId();
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { id: blockId, ...(newBlock ?? { module: "docs_1", content: "" }) });
      return next;
    });
    setTimeout(() => {
      const selector = `[data-block-id='${blockId}']`;
      const target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`input${selector}, textarea${selector}`);
      target?.focus();
    }, 0);
  }, []);

  const handleDuplicateBlock = useCallback((index: number) => {
    setBlocks((prev) => {
      const source = prev[index];
      if (!source) {
        return prev;
      }
      const next = [...prev];
      next.splice(index + 1, 0, { ...source, id: createBlockId() });
      return next;
    });
  }, []);

  const focusBlockById = useCallback((blockId: string) => {
    setTimeout(() => {
      const selector = `[data-block-id='${blockId}']`;
      const target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `input${selector}, textarea${selector}`
      );
      if (target) {
        target.focus();
        return;
      }
      const codeMirrorContent = document.querySelector<HTMLElement>(`${selector} .cm-content`);
      codeMirrorContent?.focus();
    }, 0);
  }, []);

  const handleRemoveBlock = useCallback((index: number) => {
    let focusBlockId: string | null = null;
    setBlocks((prev) => {
      if (prev.length <= 1) {
        const nextId = createBlockId();
        focusBlockId = nextId;
        return [{ id: nextId, module: "docs_1", content: "" }];
      }
      const next = [...prev];
      next.splice(index, 1);
      if (next.length === 0) {
        const nextId = createBlockId();
        focusBlockId = nextId;
        return [{ id: nextId, module: "docs_1", content: "" }];
      }
      const targetIndex = Math.max(0, index - 1);
      focusBlockId = next[targetIndex]?.id ?? null;
      return next;
    });
    if (focusBlockId) {
      focusBlockById(focusBlockId);
    }
  }, [focusBlockById]);

  const handleFocusMove = useCallback(
    (index: number, direction: "up" | "down") => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const targetBlock = blocks[targetIndex];
      if (!targetBlock) {
        return;
      }
      setTimeout(() => {
        const selector = `[data-block-id='${targetBlock.id}']`;
        const target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`input${selector}, textarea${selector}`);
        target?.focus();
      }, 0);
    },
    [blocks]
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleEditorSurfaceClick = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      if (start !== end) {
        return;
      }
    }

    const selectedText = window.getSelection()?.toString() ?? "";
    if (selectedText.length > 0) {
      return;
    }

    if (blocks.length === 0) {
      handleAddBlock(-1);
      return;
    }
    const lastBlock = blocks[blocks.length - 1];
    const isTextBlock =
      lastBlock.module === "docs_1" ||
      lastBlock.module === "list" ||
      lastBlock.module === "headline_1" ||
      lastBlock.module === "headline_2";
    if (isTextBlock && (lastBlock.content || "") === "") {
      const selector = `[data-block-id='${lastBlock.id}']`;
      const target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`input${selector}, textarea${selector}`);
      target?.focus();
      return;
    }
    handleAddBlock(blocks.length);
  }, [blocks, handleAddBlock]);

  const handleSave = useCallback(async () => {
    if (isSaving) {
      return;
    }

    const nextTitle = title.trim();
    if (!nextTitle) {
      await confirm({
        title: "검증 실패",
        message: "제목을 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    const payloadBlocks = blocks.map((block) => ({ ...block }));
    const nextSignature = toStableSignature({ title: nextTitle, blocks: payloadBlocks });
    if (nextSignature === initialSignature) {
      await confirm({
        title: "변경 없음",
        message: "변경된 내용이 없습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    try {
      setIsSaving(true);
      const endpoint = mode === "create" ? "/api/dev-content/guide" : `/api/dev-content/guide/${slug}`;
      const method = mode === "create" ? "POST" : "PUT";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: nextTitle,
          blocks: payloadBlocks,
        }),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response);
        throw new Error(message);
      }

      await confirm({
        title: mode === "create" ? "생성 완료" : "저장 완료",
        message: mode === "create" ? "가이드가 생성되었습니다." : "가이드가 저장되었습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      const result = (await response.json().catch(() => ({}))) as { slug?: string };
      const nextSlug = mode === "create" ? result.slug : slug;
      if (!nextSlug) {
        throw new Error("생성된 가이드 slug를 확인할 수 없습니다.");
      }
      router.replace(`/guide/${nextSlug}?mode=edit`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "가이드 저장에 실패했습니다.";
      await confirm({
        title: "저장 실패",
        message,
        confirmText: "확인",
        hideCancel: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [blocks, confirm, initialSignature, isSaving, mode, router, slug, title]);

  const handleDelete = useCallback(async () => {
    if (isSaving || mode !== "edit" || !slug) {
      return;
    }

    const confirmed = await confirm({
      title: "가이드 삭제",
      message: "이 가이드를 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소",
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/dev-content/guide/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response);
        throw new Error(message);
      }

      const result = (await response.json().catch(() => ({}))) as { nextSlug?: string | null };
      const nextSlug = typeof result.nextSlug === "string" ? result.nextSlug : null;

      await confirm({
        title: "삭제 완료",
        message: "가이드가 삭제되었습니다.",
        confirmText: "확인",
        hideCancel: true,
      });

      if (nextSlug) {
        router.replace(`/guide/${nextSlug}`);
      } else {
        router.replace("/guide/new");
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "가이드 삭제에 실패했습니다.";
      await confirm({
        title: "삭제 실패",
        message,
        confirmText: "확인",
        hideCancel: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [confirm, isSaving, mode, router, slug]);

  return (
    <EditorShell>
      <EditorHeader>
        <HeaderButtons>
          <SecondaryButton type="button" onClick={() => router.push("/guide/new")} disabled={isSaving}>
            새 가이드
          </SecondaryButton>
          {mode === "edit" && slug ? (
            <DangerButton type="button" onClick={() => void handleDelete()} disabled={isSaving}>
              삭제
            </DangerButton>
          ) : null}
          {mode === "edit" && slug ? (
          <SecondaryButton type="button" onClick={() => router.push(`/guide/${slug}`)} disabled={isSaving}>
            보기 모드
          </SecondaryButton>
          ) : null}
          <PrimaryButton type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? (mode === "create" ? "생성 중..." : "저장 중...") : (mode === "create" ? "생성하기" : "저장하기")}
          </PrimaryButton>
        </HeaderButtons>
      </EditorHeader>

      <FieldGroup>
        <FloatingInput
          label="문서 제목"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="문서 제목을 입력해주세요"
        />
      </FieldGroup>

      <EditorSurface onClick={handleEditorSurfaceClick}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <DocsBlockEditor
                key={block.id}
                index={index}
                block={block}
                onChange={handleBlockChange}
                onAddBlock={handleAddBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onRemoveBlock={handleRemoveBlock}
                onFocusMove={handleFocusMove}
              />
            ))}
          </SortableContext>
        </DndContext>
      </EditorSurface>
      {ConfirmDialog}
    </EditorShell>
  );
}

const EditorShell = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 40px;
  padding-right: 12px;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const BaseButton = styled.button`
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SecondaryButton = styled(BaseButton)`
  background: #fff;
  color: ${({ theme }) => theme.colors.grey[700]};
`;

const PrimaryButton = styled(BaseButton)`
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: #fff;
  border-color: ${({ theme }) => theme.colors.bssmDarkBlue};
`;

const DangerButton = styled(BaseButton)`
  background: #fff5f5;
  color: #d92d20;
  border-color: #fda29b;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EditorSurface = styled.div`
  min-height: 420px;
  display: flex;
  flex-direction: column;
`;
