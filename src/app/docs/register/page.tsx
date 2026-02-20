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

export default function DocsRegisterPage() {
  const userName = useUserStore((state) => state.user?.name || "");

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

  const handleNextStep = () => {
    if (step === 'INPUT') {
      handleFormNext();
    } else if (step === 'EDITOR') {
      saveCurrentBlock();
      setStep('CONFIRM');
    }
  };

  const handleSubmit = () => {
    submitDocs(formData, sidebarItems, contentMap, docsBlocks);
  };

  return (
    <>
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
