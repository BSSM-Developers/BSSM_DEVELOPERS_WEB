"use client";

import React from 'react';
import dynamic from "next/dynamic";
import { Container } from './styles';
import { InputStep } from './components/InputStep';
import { ConfirmStep } from './components/ConfirmStep';
import { SuccessStep } from './components/SuccessStep';
import { useDocsForm } from './hooks/useDocsForm';
import { useDocsEditor } from './hooks/useDocsEditor';
import { useDocsSubmit } from './hooks/useDocsSubmit';
import { flattenSidebarNodes, resolveContentMapWithApiDefaults } from './hooks/contentMapUtils';
import { useUserStore } from '@/store/userStore';
import { useDocsStore } from '@/store/docsStore';
import { useConfirm } from '@/hooks/useConfirm';
import { useRouter } from 'next/navigation';
import { RequireLoginGate } from "@/components/auth/RequireLoginGate";
import { useParsedEndpointsQuery } from "@/app/user/github/queries";
import { BsdevLoader } from "@/components/common/BsdevLoader";

const DRAFT_STORAGE_KEY = "docs-register-draft";
const DRAFT_VERSION = 1;

const EditorStep = dynamic(
  () => import("./components/EditorStep").then((module) => module.EditorStep),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: "100vh", background: "#FAFAFA" }} />,
  }
);

export default function DocsRegisterPage() {
  const router = useRouter();
  const userName = useUserStore((state) => state.user?.name || "");
  const { confirm, ConfirmDialog } = useConfirm();
  const [isRestored, setIsRestored] = React.useState(false);

  const {
    step,
    setStep,
    formData,
    updateFormData,
    setFullFormData,
    handleNext: handleFormNext
  } = useDocsForm();

  // 선택한 레포의 AST 파싱 엔드포인트 (Original API 일 때만)
  const parsedEndpointsQuery = useParsedEndpointsQuery(
    formData.selectedRepoId,
    formData.selectedRepoFullName,
    formData.selectedBranch,
    formData.docsType === "ORIGINAL"
  );

  const {
    docsBlocks,
    sidebarItems,
    setSidebarItems,
    handleBlockChange,
    handleAddBlock,
    handleRemoveBlock,
    handleFocusMove,
    handleDuplicateBlock,
    handleMoveBlock,
    saveCurrentBlock,
    contentMap,
    restoreEditorState
  } = useDocsEditor(step, formData.title, {
    endpoints: parsedEndpointsQuery.data ?? [],
    // Original 레포/브랜치가 선택돼 parsed-endpoints를 받아야 하는 상황인지
    expectsEndpoints:
      formData.docsType === "ORIGINAL" &&
      formData.selectedRepoId != null &&
      !!formData.selectedRepoFullName &&
      !!formData.selectedBranch,
    // 아직 결과(성공/에러)가 확정되지 않았으면 대기
    isSettled: parsedEndpointsQuery.isSuccess || parsedEndpointsQuery.isError,
    isError: parsedEndpointsQuery.isError,
  });

  const { loading, handleSubmit: submitDocs, handleSubmitCustom } = useDocsSubmit(confirm);

  const handleNextStep = async () => {
    if (step === 'INPUT') {
      const isCustom = formData.docsType === "CUSTOM";
      const titleLabel = isCustom ? "커스텀 문서 제목" : "API 이름";
      const descLabel = isCustom ? "커스텀 문서 소개" : "API 소개";

      // 공통 검증
      if (!formData.title.trim()) {
        await confirm({ title: "입력을 확인해주세요", message: `${titleLabel}을(를) 입력해주세요.`, hideCancel: true });
        return;
      }
      if (!formData.description.trim()) {
        await confirm({ title: "입력을 확인해주세요", message: `${descLabel}을(를) 입력해주세요.`, hideCancel: true });
        return;
      }

      if (isCustom) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        await handleSubmitCustom(formData);
        return;
      }

      // ORIGINAL 전용 검증
      if (!formData.domain.trim()) {
        await confirm({ title: "입력을 확인해주세요", message: "도메인 주소를 입력해주세요.", hideCancel: true });
        return;
      }
      if (!formData.selectedRepoFullName) {
        await confirm({ title: "입력을 확인해주세요", message: "레포지토리를 선택해주세요.", hideCancel: true });
        return;
      }
      if (!formData.selectedBranch) {
        await confirm({ title: "입력을 확인해주세요", message: "브랜치를 선택해주세요.", hideCancel: true });
        return;
      }

      handleFormNext();
    } else if (step === 'EDITOR') {
      saveCurrentBlock();

      const selectedId = useDocsStore.getState().selected;
      const resolvedContentMap = resolveContentMapWithApiDefaults(sidebarItems, contentMap, selectedId, docsBlocks);
      const apiNodes = flattenSidebarNodes(sidebarItems).filter((node) => node.module === "api");

      if (apiNodes.length === 0) {
        await confirm({ title: "입력을 확인해주세요", message: "최소 1개 이상의 API 문서(모듈)가 필요합니다.", hideCancel: true });
        return;
      }

      const uniqueApis = new Set<string>();

      for (const apiNode of apiNodes) {
        const blocks = resolvedContentMap[apiNode.id] ?? [];
        const apiBlock = blocks.find((block) => block.module === "api" && block.apiData);

        if (!apiBlock?.apiData) {
          await confirm({
            title: "입력을 확인해주세요",
            message: `[${apiNode.label || "API 문서"}] API 정보를 입력해주세요.`,
            hideCancel: true,
          });
          return;
        }

        const api = apiBlock.apiData;
        const docName = api.name || apiNode.label || "API 문서";
        const endpoint = api.endpoint.trim();

        if (!endpoint) {
          await confirm({
            title: "입력을 확인해주세요",
            message: `[${docName}] 엔드포인트를 입력해주세요.`,
            hideCancel: true,
          });
          return;
        }

        const methodEndpoint = `${api.method} ${endpoint}`;
        if (uniqueApis.has(methodEndpoint)) {
          await confirm({ title: "입력을 확인해주세요", message: `중복된 API가 존재합니다: ${methodEndpoint}\n동일한 식별자를 가진 API는 하나만 등록 가능합니다.`, hideCancel: true });
          return;
        }
        uniqueApis.add(methodEndpoint);

        if (api.pathParams && api.pathParams.length > 0) {
          for (const p of api.pathParams) {
            if (!p.name) continue;
            if (!endpoint.includes(`{${p.name}}`)) {
              await confirm({ title: "입력을 확인해주세요", message: `[${docName}] 선언된 Path 파라미터 '{${p.name}}'가 엔드포인트 문자열에 존재하지 않습니다.`, hideCancel: true });
              return;
            }
          }
        }

        const digitRegex = /\/[0-9]+(\/|$)/;
        const uuidRegex = /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\/|$)/;

        if (digitRegex.test(endpoint) || uuidRegex.test(endpoint)) {
          await confirm({ title: "입력을 확인해주세요", message: `[${docName}] 메인 엔드포인트 경로에 실제 파라미터 값을 직접(하드코딩) 넣을 수 없습니다. (예: /book/1 금지)\n대신 {book_id} 형태의 동적 Path 파라미터를 사용해주세요.`, hideCancel: true });
          return;
        }

        const checkParams = (params?: { name: string; description: string }[], typeStr = "") => {
          if (params && params.length > 0) {
            for (const p of params) {
              if (!p.name || !p.description) {
                return `[${docName}] ${typeStr} 파라미터의 이름과 설명을 모두 채워주세요.`;
              }
            }
          }
          return null;
        };

        const errs = [
          checkParams(api.headerParams, "Header"),
          checkParams(api.cookieParams, "Cookie"),
          checkParams(api.pathParams, "Path"),
          checkParams(api.queryParams, "Query"),
          checkParams(api.bodyParams, "Body"),
          checkParams(api.responseParams, "Response Body")
        ].filter(Boolean);

        if (errs.length > 0) {
          await confirm({ title: "입력을 확인해주세요", message: errs[0]!, hideCancel: true });
          return;
        }
      }

      setStep('CONFIRM');
    }
  };

  const handleSubmit = () => {
    const selectedId = useDocsStore.getState().selected ?? 'draft-doc';
    submitDocs(formData, sidebarItems, contentMap, docsBlocks, selectedId);
  };

  React.useEffect(() => {
    const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr) as Record<string, unknown>;

        if (draft.version !== DRAFT_VERSION) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          setIsRestored(true);
          return;
        }

        const draftStep = draft.step;
        if (
          draftStep === "INPUT" ||
          draftStep === "EDITOR" ||
          draftStep === "CONFIRM" ||
          draftStep === "SUCCESS"
        ) {
          setStep(draftStep);
        }

        const draftFormData = (draft.formData ?? {}) as Partial<{
          docsType: string;
          title: string;
          description: string;
          domain: string;
          selectedRepoFullName: string;
          selectedRepoId: number | null;
          selectedBranch: string;
          auto_approval: boolean;
        }>;

        setFullFormData({
          docsType: draftFormData.docsType === "CUSTOM" ? "CUSTOM" : "ORIGINAL",
          title: draftFormData.title ?? "",
          description: draftFormData.description ?? "",
          domain: draftFormData.domain ?? "",
          selectedRepoFullName: draftFormData.selectedRepoFullName ?? "",
          selectedRepoId: draftFormData.selectedRepoId ?? null,
          selectedBranch: draftFormData.selectedBranch ?? "",
          auto_approval: Boolean(draftFormData.auto_approval),
        });

        const draftDocsBlocks = Array.isArray(draft.docsBlocks) ? draft.docsBlocks : [];
        const draftSidebarItems = Array.isArray(draft.sidebarItems) ? draft.sidebarItems : [];
        const draftContentMap =
          draft.contentMap && typeof draft.contentMap === "object"
            ? (draft.contentMap as Record<string, unknown>)
            : {};

        restoreEditorState(
          draftDocsBlocks as typeof docsBlocks,
          draftSidebarItems as typeof sidebarItems,
          draftContentMap as typeof contentMap
        );

        if (typeof draft.selectedId === "string" && draft.selectedId) {
          useDocsStore.setState({ selected: draft.selectedId });
        }
      } catch (e) {
        console.error("Failed to restore draft", e);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
    setIsRestored(true);
  }, [setStep, setFullFormData, restoreEditorState]);

  React.useEffect(() => {
    if (step === 'SUCCESS') {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [step]);

  const hasDraftContent = formData.title.trim().length > 0 || step !== 'INPUT';

  React.useEffect(() => {
    if (isRestored && step !== 'SUCCESS') {
      if (hasDraftContent) {
        const draft = {
          version: DRAFT_VERSION,
          step,
          formData,
          docsBlocks,
          sidebarItems,
          contentMap,
          selectedId: useDocsStore.getState().selected
        };
        const timer = window.setTimeout(() => {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        }, 300);
        return () => {
          window.clearTimeout(timer);
        };
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, [isRestored, step, formData, docsBlocks, sidebarItems, contentMap, hasDraftContent]);

  React.useEffect(() => {
    if (step === 'SUCCESS' || !hasDraftContent) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, hasDraftContent]);

  React.useEffect(() => {
    if (step === 'SUCCESS' || !hasDraftContent) return;

    const handleLinkClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest('a');
      if (a && a.href) {
        const url = new URL(a.href, window.location.origin);
        if (url.pathname !== window.location.pathname) {
          e.preventDefault();
          e.stopPropagation();

          const go = await confirm({
            title: "페이지 이동 경고",
            message: "현재 페이지를 벗어나면 작성 중인 임시 저장 내용이 모두 삭제됩니다. 정말 이동하시겠습니까?",
            hideCancel: false
          });

          if (go) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            router.push(url.pathname + url.search + url.hash);
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => document.removeEventListener('click', handleLinkClick, { capture: true });
  }, [step, hasDraftContent, confirm, router]);

  if (!isRestored) {
    return (
      <RequireLoginGate>
        <div style={{ minHeight: '100vh', background: '#FAFAFA' }} />
      </RequireLoginGate>
    );
  }

  return (
    <RequireLoginGate>
      <>
        {ConfirmDialog}
        {step === 'EDITOR' && sidebarItems.length === 0 ? (
          <BsdevLoader
            fullScreen
            label="레포지토리 엔드포인트를 불러오는 중입니다..."
            size={92}
          />
        ) : step === 'EDITOR' ? (
          <EditorStep
            formData={formData}
            sidebarItems={sidebarItems}
            setSidebarItems={setSidebarItems}
            docsBlocks={docsBlocks}
            handleBlockChange={handleBlockChange}
            handleAddBlock={handleAddBlock}
            handleDuplicateBlock={handleDuplicateBlock}
            handleRemoveBlock={handleRemoveBlock}
            handleFocusMove={handleFocusMove}
            handleMoveBlock={handleMoveBlock}
            handleStepChange={setStep}
            handleNext={handleNextStep}
          />
        ) : (
          <Container>
            {step === 'INPUT' && (
              <InputStep
                formData={formData}
                updateFormData={updateFormData}
                handleNext={handleNextStep}
                userName={userName}
              />
            )}

            {step === 'CONFIRM' && (
              <ConfirmStep
                formData={formData}
                userName={userName}
                handleStepChange={setStep}
                handleSubmit={handleSubmit}
                loading={loading}
              />
            )}

            {step === 'SUCCESS' && (
              <SuccessStep />
            )}
          </Container>
        )}
      </>
    </RequireLoginGate>
  );
}
