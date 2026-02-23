"use client";

import React from 'react';
import { Container } from './styles';
import { InputStep } from './components/InputStep';
import { EditorStep } from './components/EditorStep';
import { ConfirmStep } from './components/ConfirmStep';
import { SuccessStep } from './components/SuccessStep';
import { useDocsForm } from './hooks/useDocsForm';
import { useDocsEditor } from './hooks/useDocsEditor';
import { useDocsSubmit } from './hooks/useDocsSubmit';
import { useUserStore } from '@/store/userStore';
import { useDocsStore } from '@/store/docsStore';
import { useConfirm } from '@/hooks/useConfirm';

export default function DocsRegisterPage() {
  const userName = useUserStore((state) => state.user?.name || "");
  const { confirm, ConfirmDialog } = useConfirm();

  const {
    step,
    setStep,
    formData,
    updateFormData,
    handleNext: handleFormNext
  } = useDocsForm();

  const {
    docsBlocks,
    sidebarItems,
    setSidebarItems,
    handleBlockChange,
    handleAddBlock,
    handleRemoveBlock,
    handleFocusMove,
    saveCurrentBlock,
    contentMap
  } = useDocsEditor(step, formData.title);

  const { loading, handleSubmit: submitDocs } = useDocsSubmit();

  const handleNextStep = async () => {
    if (step === 'INPUT') {
      handleFormNext();
    } else if (step === 'EDITOR') {
      saveCurrentBlock();

      const selectedId = useDocsStore.getState().selected;
      const allBlocks = { ...contentMap, [selectedId as string]: docsBlocks };

      let hasApiModule = false;
      const uniqueApis = new Set<string>();

      for (const [nodeId, blocks] of Object.entries(allBlocks)) {
        for (const block of blocks) {
          if (block.module === 'api' && block.apiData) {
            hasApiModule = true;
            const api = block.apiData;
            const docName = api.name || 'API 문서';

            const methodEndpoint = `${api.method} ${api.endpoint}`;
            if (uniqueApis.has(methodEndpoint)) {
              await confirm({ title: "검증 실패", message: `중복된 API가 존재합니다: ${methodEndpoint}\n동일한 식별자를 가진 API는 하나만 등록 가능합니다.`, hideCancel: true });
              return;
            }
            uniqueApis.add(methodEndpoint);

            if (!api.mappingEndpoint) {
              await confirm({ title: "검증 실패", message: `[${docName}] 매핑 엔드포인트(MAPPING)를 입력해주세요.`, hideCancel: true });
              return;
            }

            if (api.pathParams && api.pathParams.length > 0) {
              for (const p of api.pathParams) {
                if (!p.name) continue;
                if (!api.endpoint.includes(`{${p.name}}`)) {
                  await confirm({ title: "검증 실패", message: `[${docName}] 선언된 Path 파라미터 '{${p.name}}'가 메인 엔드포인트 문자열에 존재하지 않습니다.`, hideCancel: true });
                  return;
                }
                if (api.mappingEndpoint && !api.mappingEndpoint.includes(`{${p.name}}`)) {
                  await confirm({ title: "검증 실패", message: `[${docName}] 선언된 Path 파라미터 '{${p.name}}'가 매핑 엔드포인트 문자열에 존재하지 않습니다.`, hideCancel: true });
                  return;
                }
              }
            }

            const digitRegex = /\/[0-9]+(\/|$)/;
            const uuidRegex = /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\/|$)/;

            if (digitRegex.test(api.endpoint) || uuidRegex.test(api.endpoint)) {
              await confirm({ title: "검증 실패", message: `[${docName}] 메인 엔드포인트 경로에 실제 파라미터 값을 직접(하드코딩) 넣을 수 없습니다. (예: /book/1 금지)\n대신 {book_id} 형태의 동적 Path 파라미터를 사용해주세요.`, hideCancel: true });
              return;
            }

            if (api.mappingEndpoint && (digitRegex.test(api.mappingEndpoint) || uuidRegex.test(api.mappingEndpoint))) {
              await confirm({ title: "검증 실패", message: `[${docName}] 매핑 엔드포인트 경로에 실제 파라미터 값을 직접(하드코딩) 넣을 수 없습니다. (예: /book/1 금지)\n대신 {book_id} 형태의 동적 Path 파라미터를 사용해주세요.`, hideCancel: true });
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
              await confirm({ title: "검증 실패", message: errs[0]!, hideCancel: true });
              return;
            }

            if (!api.isVerified) {
              await confirm({ title: "검증 실패", message: `[${docName}] 실제 API 검증이 누락되었거나 실패했습니다. 검증을 다시 완벽하게 완료해주세요.`, hideCancel: true });
              return;
            }
          }
        }
      }

      if (!hasApiModule) {
        await confirm({ title: "검증 실패", message: "최소 1개 이상의 API 문서(모듈)가 필요합니다.", hideCancel: true });
        return;
      }

      setStep('CONFIRM');
    }
  };

  const handleSubmit = () => {
    submitDocs(formData, sidebarItems, contentMap, docsBlocks);
  };

  return (
    <>
      {ConfirmDialog}
      {step === 'EDITOR' ? (
        <EditorStep
          formData={formData}
          sidebarItems={sidebarItems}
          setSidebarItems={setSidebarItems}
          docsBlocks={docsBlocks}
          handleBlockChange={handleBlockChange}
          handleAddBlock={handleAddBlock}
          handleRemoveBlock={handleRemoveBlock}
          handleFocusMove={handleFocusMove}
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
  );
}
